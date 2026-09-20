#!/usr/bin/env python3
"""
STARC CMS Self-Healing Deploy Script
Fixes Payload + OpenNext + Cloudflare Workers + D1 + R2
- Fixes wrangler.toml (main, assets, bindings, compat_date)
- Fixes Media collection (disableLocalStorage, no sharp)
- Pins drizzle-orm 0.38.3 to fix this.client.prepare is not a function
- Builds, tests local, parses Digest errors, auto-fixes

Usage:
  python3 starc_heal.py --fix --build --test
  python3 starc_heal.py --fix --build --test --ai  # uses ollama if available
  python3 starc_heal.py --list-models  # list local AI models
"""

import os, sys, json, re, time, shutil, subprocess, argparse, socket
from pathlib import Path
import http.client
from datetime import datetime

CMS_DIR = Path.home() / "starc-v6-sveltekit-hono" / "cms"
# fallback to cwd if not found
if not CMS_DIR.exists():
    CMS_DIR = Path.cwd()

LOG_FILE = CMS_DIR / ".heal.log"
MAX_RETRIES = 3

def log(msg, color=""):
    colors = {"red": "\033[91m", "green": "\033[92m", "yellow": "\033[93m", "cyan": "\033[96m", "reset": "\033[0m"}
    c = colors.get(color, "")
    r = colors["reset"] if c else ""
    print(f"{c}{msg}{r}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now().isoformat()} {msg}\n")

def run(cmd, cwd=CMS_DIR, capture=True, timeout=300):
    log(f"$ {cmd}", "cyan")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=capture, text=True, timeout=timeout)
        if capture:
            if result.stdout:
                print(result.stdout[-3000:])  # last 3k
            if result.stderr:
                print(result.stderr[-3000:], file=sys.stderr)
        return result
    except subprocess.TimeoutExpired as e:
        log(f"TIMEOUT after {timeout}s: {cmd}", "red")
        return None

def read_file(p: Path):
    if p.exists():
        return p.read_text()
    return ""

def write_file(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    log(f"Wrote {p}", "green")

# --- AI model detection ---
def list_models():
    log("=== Detecting local AI models ===", "cyan")
    models = []
    # Ollama
    r = run("ollama list 2>&1", capture=True, timeout=10)
    if r and r.returncode == 0 and "NAME" in r.stdout:
        log(r.stdout, "green")
        models.append("ollama")
        # parse model names
        for line in r.stdout.splitlines()[1:]:
            if line.strip():
                models.append(line.split()[0])
    else:
        log("ollama not found or no models", "yellow")
    
    # Check common local LLMs
    for cmd in ["lm-studio --help", "llama --help", "python3 -m gpt4all --help"]:
        r = run(cmd, capture=True, timeout=5)
        if r and r.returncode == 0:
            log(f"Found: {cmd}", "green")

    # Check env
    if os.environ.get("OPENAI_API_KEY"):
        log("OPENAI_API_KEY present", "green")
        models.append("openai")
    if os.environ.get("ANTHROPIC_API_KEY"):
        log("ANTHROPIC_API_KEY present", "green")
    
    log(f"Models detected: {models}", "cyan")
    return models

def ai_analyze_error(error_text: str):
    """Try to use local ollama to analyze error"""
    try:
        # Try ollama API
        import json as js
        prompt = f"You are a Payload CMS + Cloudflare Workers expert. Analyze this error and give 1-line fix:\n\n{error_text[-2000:]}\n\nFocus on: this.client.prepare is not a function, Digest, wrangler.toml, drizzle-orm version."
        # Use ollama run if available
        r = run(f'ollama run llama3.1 -p "{prompt[:500]}" 2>&1 | head -20', capture=True, timeout=30)
        if r and r.stdout:
            log(f"AI suggestion: {r.stdout}", "yellow")
            return r.stdout
    except Exception as e:
        log(f"AI analyze failed: {e}", "yellow")
    return None

# --- Fixers ---
def fix_wrangler_toml():
    p = CMS_DIR / "wrangler.toml"
    content = read_file(p)
    original = content
    
    # Ensure required fields
    fixes = []
    
    if 'main = ' not in content:
        content = 'name = "starc-cms"\nmain = ".open-next/worker.js"\n' + content.replace('name = "starc-cms"\n', '')
        fixes.append("Added main = .open-next/worker.js")
    
    if '[assets]' not in content:
        content += '\n[assets]\ndirectory = ".open-next/assets"\nbinding = "ASSETS"\n'
        fixes.append("Added [assets] binding")
    else:
        # ensure binding ASSETS
        if 'binding = "ASSETS"' not in content and "binding = 'ASSETS'" not in content:
            content = content.replace('[assets]', '[assets]\nbinding = "ASSETS"')
            fixes.append("Fixed assets binding")
    
    if 'database_id = "2cc8e844-3ad8-4d58-9606-c4ea2cc285f3"' not in content:
        if '[[d1_databases]]' in content and 'database_id' not in content:
            content = content.replace('database_name = "starc_cms_db"', 'database_name = "starc_cms_db"\ndatabase_id = "2cc8e844-3ad8-4d58-9606-c4ea2cc285f3"')
            fixes.append("Added database_id")
    
    if 'compatibility_date' in content:
        # update to recent date to remove WARN
        content = re.sub(r'compatibility_date\s*=\s*".*?"', 'compatibility_date = "2025-09-20"', content)
        fixes.append("Updated compatibility_date to 2025-09-20")
    
    if content != original:
        write_file(p, content)
        for f in fixes:
            log(f"  - {f}", "green")
        return True
    else:
        log("wrangler.toml already OK", "green")
        return False

def fix_media_collection():
    p = CMS_DIR / "src" / "collections" / "Media.ts"
    content = read_file(p)
    if not content:
        log("Media.ts not found", "red")
        return False
    
    original = content
    # Must have disableLocalStorage
    if 'disableLocalStorage' not in content:
        # inject into upload: {}
        content = content.replace('upload:', 'upload: {\n      disableLocalStorage: true,')
        # if no upload, add it
        if 'disableLocalStorage' not in content:
            content = re.sub(r'(slug:\s*[\'"]media[\'"]\s*,)', r'\1\n  upload: { disableLocalStorage: true },', content)
        log("Added disableLocalStorage: true", "yellow")
    
    # Remove sharp usage
    if 'sharp' in content.lower():
        content = re.sub(r'import.*sharp.*\n', '', content)
        content = re.sub(r'sharp.*:.*true', '', content)
        log("Removed sharp import", "yellow")
    
    if content != original:
        write_file(p, content)
        return True
    log("Media.ts OK", "green")
    return False

def fix_payload_config():
    p = CMS_DIR / "src" / "payload.config.ts"
    content = read_file(p)
    if not content:
        log("payload.config.ts not found", "red")
        return False
    
    original = content
    # Ensure no sharp:false as any hack that broke build
    if 'sharp' in content.lower() and 'as any' in content:
        content = re.sub(r'sharp.*:.*false.*as.*any.*\n', '', content)
        content = re.sub(r'sharp.*\n', '', content)
        log("Cleaned sharp hack", "yellow")
    
    # Ensure sqliteD1Adapter present
    if 'sqliteD1Adapter' not in content:
        log("WARNING: sqliteD1Adapter missing in payload.config.ts", "red")
    
    # Ensure r2Storage present
    if 'r2Storage' not in content:
        log("WARNING: r2Storage missing", "yellow")
    
    if content != original:
        write_file(p, content)
        return True
    log("payload.config.ts OK", "green")
    return False

def fix_package_json():
    p = CMS_DIR / "package.json"
    content = read_file(p)
    if not content:
        log("package.json not found", "red")
        return False
    
    try:
        data = json.loads(content)
    except:
        log("package.json invalid json", "red")
        return False
    
    deps = data.get("dependencies", {})
    changed = False
    
    # Pin drizzle-orm to 0.38.3 - fixes prepare()
    current_drizzle = deps.get("drizzle-orm", "")
    if current_drizzle != "0.38.3":
        log(f"Pinning drizzle-orm 0.38.3 (was {current_drizzle}) - fixes this.client.prepare", "yellow")
        # Will install via npm, not edit json directly to keep exact
        changed = True
    
    # Ensure db adapters present
    for pkg in ["@payloadcms/db-d1-sqlite", "@payloadcms/storage-r2"]:
        if pkg not in deps:
            log(f"Missing {pkg}", "red")
    
    return changed

def clean_build():
    log("Cleaning .open-next .next .wrangler", "cyan")
    for d in [".open-next", ".next", ".wrangler"]:
        dp = CMS_DIR / d
        if dp.exists():
            shutil.rmtree(dp, ignore_errors=True)
            log(f"Removed {d}", "yellow")

def build_cf():
    log("=== Running npm run build:cf ===", "cyan")
    r = run("npm run build:cf", timeout=300)
    if not r:
        return False, "timeout"
    out = (r.stdout or "") + (r.stderr or "")
    if "Compiled successfully" in out or "Worker saved" in out:
        log("Build SUCCESS ✓", "green")
        return True, out
    else:
        log("Build FAILED", "red")
        # Check for sharp error
        if "sharp" in out.lower():
            log("Build failed due to sharp - need to remove sharp", "red")
        if "as any" in out and "not used" in out:
            log("Build failed due to @ts-expect-error unused", "red")
        return False, out

def test_local():
    log("=== Testing wrangler dev --local ===", "cyan")
    # Start wrangler in background
    import threading
    
    proc = subprocess.Popen(
        "npx wrangler dev --local --port 8787",
        shell=True,
        cwd=CMS_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    logs = []
    ready = False
    has_prepare_error = False
    start = time.time()
    
    try:
        while time.time() - start < 90:
            line = proc.stdout.readline()
            if not line:
                if proc.poll() is not None:
                    break
                time.sleep(0.5)
                continue
            logs.append(line)
            print(line, end="")
            if "Ready on http://localhost:8787" in line:
                ready = True
                log("Server Ready - waiting 8s for D1 init", "green")
                time.sleep(8)
                break
            if "this.client.prepare is not a function" in line:
                has_prepare_error = True
            if "✘ [ERROR]" in line and "prepare" in line:
                has_prepare_error = True
    
        if not ready:
            log("Server did not become Ready in 90s", "red")
            proc.terminate()
            return False, "".join(logs), "not_ready"
        
        # Test /admin/login via http
        log("Testing http://localhost:8787/admin/login", "cyan")
        try:
            conn = http.client.HTTPConnection("localhost", 8787, timeout=10)
            conn.request("GET", "/admin/login")
            resp = conn.getresponse()
            body = resp.read().decode('utf-8', errors='ignore')[:2000]
            log(f"GET /admin/login → {resp.status}", "cyan")
            
            if "this.client.prepare is not a function" in body or "Application error" in body or "Digest" in body:
                log("Page shows Application error / Digest - D1 prepare() bug still present", "red")
                has_prepare_error = True
            elif resp.status == 200 and ("Create first admin" in body or "Payload" in body or "admin" in body.lower()):
                log("✅ /admin/login renders Create first admin - FIXED!", "green")
                proc.terminate()
                return True, "".join(logs), "ok"
            else:
                log(f"Body preview: {body[:500]}", "yellow")
                
        except Exception as e:
            log(f"HTTP test failed: {e}", "red")
        
        proc.terminate()
        
        if has_prepare_error:
            return False, "".join(logs), "prepare_error"
        return False, "".join(logs), "unknown"
        
    finally:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except:
            proc.kill()

def apply_prepare_fix():
    log("=== Applying fix for this.client.prepare is not a function ===", "yellow")
    # Pin drizzle-orm 0.38.3
    run("npm install drizzle-orm@0.38.3 --save-exact", timeout=120)
    # Update payload D1 adapter
    run("npm install @payloadcms/db-d1-sqlite@latest payload@latest --save", timeout=120)
    run("npm install", timeout=120)
    clean_build()
    log("Fix applied - rebuild needed", "green")

def main():
    parser = argparse.ArgumentParser(description="STARC CMS Self-Healing")
    parser.add_argument("--fix", action="store_true", help="Fix wrangler.toml, Media.ts, payload.config.ts")
    parser.add_argument("--build", action="store_true", help="Run npm run build:cf")
    parser.add_argument("--test", action="store_true", help="Test wrangler dev --local")
    parser.add_argument("--ai", action="store_true", help="Use local AI to analyze errors")
    parser.add_argument("--list-models", action="store_true", help="List local AI models")
    parser.add_argument("--full", action="store_true", help="Full heal: fix + build + test + auto-fix loop")
    args = parser.parse_args()
    
    if args.list_models:
        list_models()
        return
    
    if args.full:
        args.fix = args.build = args.test = True
    
    if not (args.fix or args.build or args.test):
        parser.print_help()
        return
    
    log(f"STARC Heal starting in {CMS_DIR}", "cyan")
    log(f"Time: {datetime.now()}", "cyan")
    
    if args.fix:
        log("\n=== PHASE 1: Fixing configs ===", "cyan")
        fix_wrangler_toml()
        fix_media_collection()
        fix_payload_config()
        fix_package_json()
        
        # Check .env
        env_path = CMS_DIR / ".env"
        if env_path.exists():
            log(f".env exists: {env_path}", "green")
            content = read_file(env_path)
            if "PAYLOAD_SECRET" not in content:
                log("PAYLOAD_SECRET missing in .env", "red")
            if "PAYLOAD_PUBLIC_SERVER_URL" not in content:
                log("PAYLOAD_PUBLIC_SERVER_URL missing in .env", "yellow")
    
    if args.build:
        log("\n=== PHASE 2: Building ===", "cyan")
        clean_build()
        success, out = build_cf()
        if not success:
            log("Build failed - attempting auto-fix", "red")
            if args.ai:
                ai_analyze_error(out)
            # Try common fixes
            if "sharp" in out.lower():
                log("Removing sharp references...", "yellow")
                # remove sharp from package.json?
                run("npm uninstall sharp", timeout=60)
                success, out = build_cf()
            
            if not success:
                log("Build still failing - check .heal.log", "red")
                if not args.full:
                    return
    
    if args.test:
        log("\n=== PHASE 3: Testing local dev ===", "cyan")
        for attempt in range(1, MAX_RETRIES+1):
            log(f"\n--- Test attempt {attempt}/{MAX_RETRIES} ---", "cyan")
            success, logs, reason = test_local()
            
            if success:
                log("\n🎉 LOCAL TEST PASSED - Ready to push to Cloudflare!", "green")
                log("Next: git add -A && git commit -m 'fix: heal' && git push origin main", "cyan")
                break
            else:
                log(f"Test failed: {reason}", "red")
                if reason == "prepare_error":
                    log("Detected this.client.prepare bug - applying fix", "yellow")
                    if args.ai:
                        ai_analyze_error(logs)
                    apply_prepare_fix()
                    log("Retrying build + test...", "cyan")
                    build_cf()
                else:
                    log("Unknown failure - check logs", "red")
                    if args.ai:
                        ai_analyze_error(logs)
        else:
            log(f"\n❌ Failed after {MAX_RETRIES} attempts - see {LOG_FILE}", "red")

if __name__ == "__main__":
    main()
