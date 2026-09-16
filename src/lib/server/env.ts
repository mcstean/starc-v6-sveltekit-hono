import type { DbBinding } from './db';
import { createKV } from './kv';
import { createFiles } from './files';

const NOOP_KV = {
  get: async (_: string): Promise<string | null> => null,
  put: async (_: string, __: string): Promise<void> => {}
};

export function createEnv(bindings: Record<string, any>) {
  const db = bindings.DB as DbBinding | undefined;
  const kv = db ? createKV(db) : NOOP_KV;
  const files = createFiles(bindings);
  return {
    DB: db,
    KV: kv,
    FILES: files,
    EVOLUTION_API_URL: bindings.EVOLUTION_API_URL || '',
    EVOLUTION_API_KEY: bindings.EVOLUTION_API_KEY || '',
    EVOLUTION_INSTANCE: bindings.EVOLUTION_INSTANCE || '',
    WHATSAPP_ADMIN: bindings.WHATSAPP_ADMIN || '2376XXXXXXXX',
    DEFAULT_SHIPPING_RATE: bindings.DEFAULT_SHIPPING_RATE || '2500',
    DEFAULT_CUSTOMS_RATE: bindings.DEFAULT_CUSTOMS_RATE || '32'
  };
}
