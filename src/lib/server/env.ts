import { createDb } from './pg';
import { createKV } from './kv';
import { createFiles } from './files';

const NOOP_DB: any = {
  prepare: () => ({
    bind: () => ({
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({ meta: { last_row_id: null }, success: true })
    })
  })
};
const NOOP_KV = {
  get: async (_: string) => null,
  put: async (_: string, __: string) => {}
};

export function createEnv(bindings: Record<string, any>) {
  const hasDb = !!bindings.DATABASE_URL;
  const db = hasDb ? createDb(bindings.DATABASE_URL) : NOOP_DB;
  const kv = hasDb ? createKV(db) : NOOP_KV;
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
