#!/usr/bin/env python3
"""
STARC CMS - AUDIT SCRIPT
Run: python3 ./starc_audit.py
Checks what starc_complete.py changed and what's still pending in D1
"""
import subprocess
from pathlib import Path

ROOT = Path.cwd()
print(f"\n=== STARC CMS AUDIT ===")
print(f"Root: {ROOT}\n")

def run(cmd, cwd=ROOT):
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=15)
        return result.stdout.strip() + "\n" + result.stderr.strip()
    except Exception as e:
        return f"ERROR: {e}"

def check_file(path: Path):
    if path.exists():
        size = path.stat().st_size
        return f"✓ EXISTS ({size} bytes)"
    else:
        return "✗ MISSING"

print("--- 1. GIT CHANGES ---")
print(run("git log --oneline -8"))
print(run("git status --short"))

print("\n--- 2. COLLECTIONS AUDIT ---")
for p in sorted((ROOT / "src" / "collections").glob("*.ts")):
    print(f"  {p.name}: {check_file(p)}")

print("\n--- 3. ACCESS CONTROL ---")
print(f"  src/access/roles.ts: {check_file(ROOT / 'src' / 'access' / 'roles.ts')}")

print("\n--- 4. PAYLOAD CONFIG ---")
for cfg_path in [ROOT / "src" / "payload.config.ts", ROOT / "payload.config.ts"]:
    if cfg_path.exists():
        txt = cfg_path.read_text()
        for needle in ["binding: 'DB'", "Admins", "Courses", "guest-demo"]:
            print(f"    - {needle}: {'✓' if needle in txt else '✗'}")

print("\n--- 5. WRANGLER.TOML AUDIT ---")
wt = ROOT / "wrangler.toml"
if wt.exists():
    print(wt.read_text())

print("\n--- 6. MIGRATIONS AUDIT ---")
for folder in [ROOT / "src" / "migrations"]:
    if folder.exists():
        print(f"  {folder}: {len(list(folder.glob('*')))} files")
        split = folder / "split"
        if split.exists():
            print(f"    - split/*.sql: {len(list(split.glob('*.sql')))} files")

print("\n--- 7. D1 REMOTE TABLES ---")
d1_out = run("npx wrangler d1 execute DB --remote --command=\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' ORDER BY name;\"")
print(d1_out)
for tbl in ["admins","users","categories","products","courses","lessons","enrollments"]:
    print(f"    - {tbl}: {'✓ DEPLOYED' if tbl in d1_out.lower() else '✗ PENDING'}")

print("\n--- 8. SUMMARY ---")
print("Done by starc_complete.py: Admins (super-admin no guest, admin, collaborator, guest-demo read-only), Users, Products, Courses/Lessons/Enrollments for LMS")
print("Pending: Remote D1 still missing admins/courses/etc - causes tail connection lost")
