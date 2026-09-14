import { createDb } from './pg';
import { createKV } from './kv';
import { createFiles } from './files';

const db = createDb();
const kv = createKV();
const files = createFiles();

export const env = {
  DB: db,
  KV: kv,
  FILES: files,
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  EVOLUTION_INSTANCE: process.env.EVOLUTION_INSTANCE || '',
  WHATSAPP_ADMIN: process.env.WHATSAPP_ADMIN || '2376XXXXXXXX',
  DEFAULT_SHIPPING_RATE: process.env.DEFAULT_SHIPPING_RATE || '2500',
  DEFAULT_CUSTOMS_RATE: process.env.DEFAULT_CUSTOMS_RATE || '32'
};
