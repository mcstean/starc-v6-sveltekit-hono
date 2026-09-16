import type { DbBinding } from './db';

export const createKV = (db: DbBinding) => ({
  async get(key: string): Promise<string | null> {
    try {
      const row = await db.prepare('SELECT value FROM settings WHERE key=?').bind(key).first<{ value: string }>();
      return row?.value ?? null;
    } catch { return null; }
  },
  async put(key: string, value: string): Promise<void> {
    await db.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").bind(key, value).run();
  }
});
