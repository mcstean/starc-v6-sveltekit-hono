import type { Env } from './db';

export function normalizeNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

export async function sendWhatsApp(env: Env, phone: string, message: string, mediaUrl?: string): Promise<{ ok: boolean; raw?: any }> {
  const base = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const instance = env.EVOLUTION_INSTANCE;
  const key = env.EVOLUTION_API_KEY;
  if (!base || !instance || !key) {
    await logWhatsApp(env, phone, message, 'error', 'missing-evolution-config');
    return { ok: false };
  }
  const url = mediaUrl
    ? `${base}/message/sendMedia/${instance}`
    : `${base}/message/sendText/${instance}`;
  const body = mediaUrl
    ? { number: normalizeNumber(phone), mediatype: 'document', media: mediaUrl, fileName: 'receipt.pdf', caption: message }
    : { number: normalizeNumber(phone), text: message };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify(body)
    });
    await logWhatsApp(env, phone, message, mediaUrl ? 'media' : 'text', r.ok ? 'sent' : 'error');
    return { ok: r.ok };
  } catch (e: any) {
    await logWhatsApp(env, phone, message, 'error', String(e?.message || e));
    return { ok: false };
  }
}

export async function logWhatsApp(env: Env, phone: string, message: string, type: string, status: string) {
  try {
    await env.DB.prepare(
      `INSERT INTO whatsapp_logs (phone, message, type, status) VALUES (?, ?, ?, ?)`
    ).bind(phone, message, type, status).run();
  } catch {}
}

export async function alertAdmin(env: Env, message: string) {
  if (!env.WHATSAPP_ADMIN) return;
  await sendWhatsApp(env, env.WHATSAPP_ADMIN, message);
}
