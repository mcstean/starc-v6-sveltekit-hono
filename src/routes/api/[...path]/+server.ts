import { app } from '$lib/server/hono';
import { createDb } from '$lib/server/pg';
import { createKV } from '$lib/server/kv';
import { createFiles } from '$lib/server/files';

const db = createDb();
const kv = createKV();
const files = createFiles();

const env = {
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

const fallback = async ({ request }: any) => {
  return app.fetch(request, env);
};

export const GET = fallback;
export const POST = fallback;
export const PUT = fallback;
export const DELETE = fallback;
export const PATCH = fallback;
