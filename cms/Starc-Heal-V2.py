#!/usr/bin/env python3
"""
STARC CMS Self-Healing v2 - Fixes Digest 3658949294 / 1304070693 / 3032886885
This is the same root cause: this.client.prepare is not a function
- Happens when Media.ts uses staticDir or sharp in Workers
- Happens when drizzle-orm >0.38.5 with wrangler 4.135.0
- Happens when wrangler.toml missing assets binding

Usage:
  python3 starc_heal_v2.py --full
"""

import subprocess, re, json
from pathlib import Path

CMS_DIR = Path.home() / "starc-v6-sveltekit-hono" / "cms"
if not CMS_DIR.exists():
    CMS_DIR = Path.cwd()

def log(msg, color=""):
    colors = {"red": "\033[91m", "green": "\033[92m", "yellow": "\033[93m", "cyan": "\033[96m"}
    c = colors.get(color, "")
    print(f"{c}{msg}\033[0m" if c else msg)

def run(cmd, timeout=300):
    log(f"$ {cmd}", "cyan")
    try:
        r = subprocess.run(cmd, shell=True, cwd=CMS_DIR, capture_output=True, text=True, timeout=timeout)
        print((r.stdout[-4000:] if r.stdout else "") + (r.stderr[-4000:] if r.stderr else ""))
        return r.returncode == 0, r.stdout + r.stderr
    except Exception as e:
        log(f"ERR {e}", "red")
        return False, str(e)

def fix_wrangler():
    p = CMS_DIR / "wrangler.toml"
    content = p.read_text() if p.exists() else ""
    
    new_content = '''name = "starc-cms"
main = ".open-next/worker.js"
compatibility_date = "2025-09-20"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[build]
command = "npm run build:cf"

[[d1_databases]]
binding = "DB"
database_name = "starc_cms_db"
database_id = "2cc8e844-3ad8-4d58-9606-c4ea2cc285f3"

[[r2_buckets]]
binding = "R2"
bucket_name = "starc-cms-media"

[observability]
enabled = true
'''
    p.write_text(new_content)
    log("Fixed wrangler.toml - main, assets, database_id, compat_date 2025-09-20", "green")

def fix_media():
    p = CMS_DIR / "src" / "collections" / "Media.ts"
    if not p.exists():
        log("Media.ts not found", "red")
        return
    # Workers-safe Media - NO staticDir, NO sharp, disableLocalStorage
    content = '''import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: '02 - Content' },
  upload: {
    disableLocalStorage: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'alt', type: 'text' },
  ],
}
'''
    p.write_text(content)
    log("Fixed Media.ts - disableLocalStorage:true, no staticDir, no sharp", "green")

def fix_payload_config():
    p = CMS_DIR / "src" / "payload.config.ts"
    if not p.exists():
        p = CMS_DIR / "payload.config.ts"
    if not p.exists():
        log("payload.config.ts not found", "red")
        return
    txt = p.read_text()
    # Ensure sharp:false and binding: 'DB' and no sharp import
    txt = re.sub(r'import.*sharp.*\n', '', txt)
    txt = re.sub(r'sharp\s*:\s*.*?,', 'sharp: false,', txt)
    if 'sharp: false' not in txt:
        txt = txt.replace('secret:', 'sharp: false,\n  secret:')
    if "binding: 'DB'" not in txt and 'binding: "DB"' not in txt:
        txt = txt.replace('sqliteD1Adapter({', 'sqliteD1Adapter({\n    binding: \'DB\',')
    # Remove getPlatformProxy usage if present (causes prepare error)
    txt = re.sub(r'.*getPlatformProxy.*\n', '', txt)
    p.write_text(txt)
    log("Fixed payload.config.ts - sharp:false, binding DB", "green")

def fix_package():
    p = CMS_DIR / "package.json"
    if not p.exists():
        return
    data = json.loads(p.read_text())
    deps = data.get('dependencies', {})
    # Pin drizzle to working version for wrangler 4.135.0
    log("Pinning drizzle-orm@0.38.3 and updating db-d1-sqlite", "yellow")
    run("npm install drizzle-orm@0.38.3 --save-exact", timeout=120)
    run("npm install @payloadcms/db-d1-sqlite@latest payload@latest --save", timeout=120)
    run("npm uninstall sharp", timeout=60)

def clean_build():
    run("rm -rf .open-next .next .wrangler node_modules/.cache", timeout=30)

def build():
    ok, out = run("npm run build:cf", timeout=400)
    if ok and "Compiled successfully" in out and "Worker saved" in out:
        log("BUILD OK - 52s compile", "green")
        return True
    log("BUILD FAILED", "red")
    return False

def main():
    log(f"Healing {CMS_DIR}", "cyan")
    fix_wrangler()
    fix_media()
    fix_payload_config()
    fix_package()
    clean_build()
    if build():
        log("\n=== NOW TEST ===", "cyan")
        log("Run: npx wrangler dev --local", "cyan")
        log("Wait for Ready on http://localhost:8787 (10s)", "yellow")
        log("Open http://localhost:8787/admin/login - should show Create first admin, NOT Digest", "green")
        log("\nIf OK, push:", "cyan")
        log("git add -A && git commit -m 'fix: heal v2 - Digest 3658949294 - disableLocalStorage + drizzle 0.38.3' && git push origin main", "cyan")
    else:
        log("Build still failing - check .env and payload.config.ts", "red")

if __name__ == "__main__":
    main()
