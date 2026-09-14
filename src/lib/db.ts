export type Env = {
  DB: any; KV: any; FILES: any;
  EVOLUTION_API_URL: string; EVOLUTION_API_KEY: string;
  EVOLUTION_INSTANCE: string; WHATSAPP_ADMIN: string;
  DEFAULT_SHIPPING_RATE: string; DEFAULT_CUSTOMS_RATE: string;
};
export async function getShippingRate(env: Env): Promise<number> {
  const v = await env.KV.get('shipping_rate');
  return v? Number(v) : Number(env.DEFAULT_SHIPPING_RATE || 2500);
}
export async function getCustomsRate(env: Env): Promise<number> {
  const v = await env.KV.get('customs_rate');
  return v? Number(v) : Number(env.DEFAULT_CUSTOMS_RATE || 32);
}
export function computeCBM(l:number,w:number,h:number){ return (l*w*h)/1000000; }
export async function nextReceiptNumber(env: Env): Promise<string> {
  const year = new Date().getFullYear();
  const row = await env.DB.prepare(`SELECT COUNT(*) as c FROM receipts WHERE receipt_number LIKE?`).bind(`STARC-${year}-%`).first<{c:number}>();
  const n = (row?.c?? 0) + 1;
  return `STARC-${year}-${String(n).padStart(4,'0')}`;
}
export async function upsertCustomer(env: Env, payload:{name:string;phone:string;email?:string;city?:string;referred_by?:string}){
  const existing = await env.DB.prepare(`SELECT * FROM customers WHERE phone=?`).bind(payload.phone).first<any>();
  if(existing){
    await env.DB.prepare(`UPDATE customers SET name=?, email=COALESCE(?,email), city=COALESCE(?,city), last_order_at=NOW() WHERE phone=?`).bind(payload.name, payload.email??null, payload.city??null, payload.phone).run();
    return existing.id as number;
  }
  const code = 'STARC-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const res = await env.DB.prepare(`INSERT INTO customers (name,phone,email,city,referral_code,referred_by,last_order_at) VALUES (?,?,?,?,?,?,NOW())`).bind(payload.name,payload.phone,payload.email??null,payload.city??null,code,payload.referred_by??null).run();
  return res.meta.last_row_id as number;
}
