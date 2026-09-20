#!/usr/bin/env python3
import subprocess, re, json
from pathlib import Path
CMS_DIR = Path.cwd()
def run(cmd, timeout=300):
    print(f"$ {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=CMS_DIR, capture_output=True, text=True, timeout=timeout)
    print((r.stdout[-4000:] if r.stdout else "") + (r.stderr[-4000:] if r.stderr else ""))
    return r.returncode == 0
print(f"Healing {CMS_DIR}")
Path("wrangler.toml").write_text('name = "starc-cms"\nmain = ".open-next/worker.js"\ncompatibility_date = "2025-09-20"\ncompatibility_flags = ["nodejs_compat"]\n\n[assets]\ndirectory = ".open-next/assets"\nbinding = "ASSETS"\n\n[build]\ncommand = "npm run build:cf"\n\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "starc_cms_db"\ndatabase_id = "2cc8e844-3ad8-4d58-9606-c4ea2cc285f3"\n\n[[r2_buckets]]\nbinding = "R2"\nbucket_name = "starc-cms-media"\n\n[observability]\nenabled = true\n')
Path("src/collections/Media.ts").write_text("import type { CollectionConfig } from 'payload'\nexport const Media: CollectionConfig = {\n slug: 'media',\n upload: { disableLocalStorage: true },\n access: { read: () => true },\n fields: [{ name: 'alt', type: 'text' }],\n}\n")
run("npm install drizzle-orm@0.38.3 --save-exact")
run("rm -rf.open-next.wrangler.next")
run("npm run build:cf")
