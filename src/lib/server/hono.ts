import { Hono } from 'hono';
import type { Env } from '$lib/db';

import { env as railwayEnv } from './env';
import { getShippingRate, getCustomsRate, computeCBM, nextReceiptNumber, upsertCustomer } from '$lib/db';
import { sendWhatsApp, alertAdmin, logWhatsApp } from '$lib/whatsapp';


import { env as railwayEnv } from './env';

export const app = new Hono<{ Bindings: Env }>();




app.use('*', async (c, next) => {
  if (!c.env || !(c.env as any).DB) {
    (c as any).env = railwayEnv;
  }
  await next();
});


app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.get('/api/services', async (c) => {
  try {
    const rows = await c.env.DB.prepare('SELECT * FROM services').all();
    return c.json(rows.results);
  } catch { return c.json([]); }
});

app.post('/api/leads', async (c) => {
  const body = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO leads (name, phone, email, service, message, source) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(body.name, body.phone, body.email ?? null, body.service ?? null, body.message ?? null, body.source ?? 'website').run();
  await alertAdmin(c.env, `Nouveau lead: ${body.name} - ${body.phone}`);
  await sendWhatsApp(c.env, body.phone, `Bonjour ${body.name}, merci de nous avoir contacte chez STARC.CM !`);
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.get('/api/leads', async (c) => {
  const status = c.req.query('status');
  const q = status
    ? c.env.DB.prepare('SELECT * FROM leads WHERE status=? ORDER BY id DESC').bind(status)
    : c.env.DB.prepare('SELECT * FROM leads ORDER BY id DESC');
  const rows = await q.all();
  return c.json(rows.results);
});

app.put('/api/leads/:id', async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE leads SET status=COALESCE(?,status), assigned_to=COALESCE(?,assigned_to) WHERE id=?`
  ).bind(body.status ?? null, body.assigned_to ?? null, c.req.param('id')).run();
  return c.json({ ok: true });
});

app.get('/api/products', async (c) => {
  const filter = c.req.query('filter');
  const category = c.req.query('category');
  const search = c.req.query('search');
  let sql = 'SELECT * FROM products WHERE 1=1';
  const binds: any[] = [];
  if (filter === 'INSTOCK') sql += ' AND is_instock=1';
  if (filter === 'PREORDER') sql += ' AND is_preorder=1';
  if (category) { sql += ' AND category=?'; binds.push(category); }
  if (search) { sql += ' AND (product_name LIKE ? OR sku LIKE ?)'; binds.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY id DESC LIMIT 200';
  try {
    const rows = await c.env.DB.prepare(sql).bind(...binds).all();
    return c.json(rows.results);
  } catch { return c.json([]); }
});

app.get('/api/products/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM products WHERE id=?').bind(c.req.param('id')).first();
  if (!row) return c.json({ error: 'not found' }, 404);
  await c.env.DB.prepare('UPDATE products SET views=views+1 WHERE id=?').bind(c.req.param('id')).run();
  return c.json(row);
});

app.get('/api/groups', async (c) => {
  try {
    const rows = await c.env.DB.prepare('SELECT * FROM preorder_groups ORDER BY id DESC').all();
    return c.json(rows.results);
  } catch { return c.json([]); }
});

app.get('/api/groups/:id/products', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM products WHERE group_id=?').bind(c.req.param('id')).all();
  return c.json(rows.results);
});

app.post('/api/groups', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO preorder_groups (title, origin_country, shipping_mode, closing_date, eta_date, status, shipping_cost_per_kg)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(b.title, b.origin_country, b.shipping_mode, b.closing_date, b.eta_date, b.status ?? 'OPEN', b.shipping_cost_per_kg ?? 2500).run();
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.put('/api/groups/:id', async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const old: any = await c.env.DB.prepare('SELECT * FROM preorder_groups WHERE id=?').bind(id).first();
  await c.env.DB.prepare(
    `UPDATE preorder_groups SET title=COALESCE(?,title), status=COALESCE(?,status), eta_date=COALESCE(?,eta_date) WHERE id=?`
  ).bind(b.title ?? null, b.status ?? null, b.eta_date ?? null, id).run();
  if (b.status && old && old.status !== b.status) {
    const orders = await c.env.DB.prepare('SELECT DISTINCT customer_phone FROM preorder_orders WHERE group_id=?').bind(id).all<{ customer_phone: string }>();
    for (const o of orders.results) {
      await sendWhatsApp(c.env, o.customer_phone, `STARC.CM - Groupe "${old.title}" est maintenant: ${b.status}`);
    }
    if (b.status === 'ARRIVED') {
      const rows = await c.env.DB.prepare('SELECT customer_phone, remaining_xaf FROM preorder_orders WHERE group_id=?').bind(id).all<{ customer_phone: string; remaining_xaf: number }>();
      for (const r of rows.results) {
        await sendWhatsApp(c.env, r.customer_phone, `Votre commande est arrivee a Douala-Makepe. Reste: ${Number(r.remaining_xaf).toLocaleString()} XAF.`);
      }
    }
  }
  return c.json({ ok: true });
});

app.post('/api/orders', async (c) => {
  const b = await c.req.json();
  const shippingRate = await getShippingRate(c.env);
  const customsRate = await getCustomsRate(c.env);
  const customerId = await upsertCustomer(c.env, {
    name: b.customer.name, phone: b.customer.phone,
    email: b.customer.email, city: b.customer.city,
    referred_by: b.recruiter_code ?? null
  });
  const items: any[] = [];
  let subtotal = 0, shipping = 0, customs = 0;
  for (const it of b.items) {
    const p: any = await c.env.DB.prepare('SELECT * FROM products WHERE id=?').bind(it.product_id).first();
    if (!p) continue;
    const lineTotal = p.unit_price_xaf * it.qty;
    const lineShipping = p.weight_kg * shippingRate * it.qty;
    const cbm = computeCBM(p.length_cm, p.width_cm, p.height_cm);
    const lineCustoms = (p.unit_price_xaf * it.qty) * (customsRate / 100);
    subtotal += lineTotal; shipping += lineShipping; customs += lineCustoms;
    items.push({ ...p, qty: it.qty, lineTotal, lineShipping, lineCustoms, cbm });
  }
  const insurance = b.insurance ? (subtotal * 0.03) : 0;
  let deliveryFee = 0;
  if (b.delivery_mode === 'domicile') {
    const zone: any = await c.env.DB.prepare('SELECT fee FROM delivery_zones WHERE city=?').bind(b.customer.city).first();
    deliveryFee = zone?.fee ?? 2000;
  }
  const total = subtotal + shipping + customs + insurance + deliveryFee;
  const paid = b.payment_mode === 'FULL_100' ? total : total * 0.30;
  const remaining = total - paid;
  const groupId = items.find(i => i.group_id)?.group_id ?? null;
  const orderRes = await c.env.DB.prepare(
    `INSERT INTO preorder_orders
      (group_id, product_id, customer_id, customer_name, customer_phone, quantity, unit_price_snapshot,
       shipping_share_xaf, customs_share_xaf, delivery_fee, total_xaf, deposit_paid, remaining_xaf,
       payment_mode, payment_status, delivery_mode, delivery_address, insurance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    groupId, items[0]?.id ?? null, customerId, b.customer.name, b.customer.phone,
    items.reduce((s, i) => s + i.qty, 0), items[0]?.unit_price_xaf ?? 0,
    shipping, customs, deliveryFee, total, paid, remaining,
    b.payment_mode, paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING'),
    b.delivery_mode, b.delivery_address ?? null, b.insurance ? 1 : 0, 'PENDING'
  ).run();
  const orderId = orderRes.meta.last_row_id;
  for (const it of items) {
    await c.env.DB.prepare(
      `INSERT INTO inventory_movements (product_id, type, qty, from_status, to_status, reference_id, created_by)
       VALUES (?, 'RESERVED', ?, 'PENDING', 'RESERVED', ?, 'system')`
    ).bind(it.id, it.qty, String(orderId)).run();
    if (it.is_preorder) {
      await c.env.DB.prepare('UPDATE products SET moq_current = moq_current + ? WHERE id=?').bind(it.qty, it.id).run();
    }
  }
  const receiptNumber = await nextReceiptNumber(c.env);
  const itemsJson = JSON.stringify(items.map(i => ({ id: i.id, name: i.product_name, qty: i.qty, unit: i.unit_price_xaf, total: i.lineTotal })));
  await c.env.DB.prepare(
    `INSERT INTO receipts (receipt_number, order_id, customer_id, type, items_json, subtotal, shipping_total, customs_total, insurance_total, delivery_total, total_xaf, paid_xaf, remaining_xaf, payment_method, group_info_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(receiptNumber, orderId, customerId, b.payment_mode, itemsJson, subtotal, shipping, customs, insurance, deliveryFee, total, paid, remaining, b.payment_method ?? 'Campay', JSON.stringify({ group_id: groupId })).run();
  await c.env.DB.prepare('UPDATE preorder_orders SET receipt_number=? WHERE id=?').bind(receiptNumber, orderId).run();
  await c.env.DB.prepare('UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id=?').bind(total, customerId).run();
  const trackUrl = `https://starc.cm/receipt/${orderId}`;
  await sendWhatsApp(c.env, b.customer.phone, `Merci ${b.customer.name}! Recu: ${receiptNumber}. Total: ${total.toLocaleString()} XAF. Suivi: ${trackUrl}`);
  await alertAdmin(c.env, `Nouvelle commande ${receiptNumber} - ${b.customer.phone} - ${total.toLocaleString()} XAF`);
  return c.json({ ok: true, order_id: orderId, receipt_number: receiptNumber, total, paid, remaining });
});

app.get('/api/orders', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM preorder_orders ORDER BY id DESC LIMIT 500').all();
  return c.json(rows.results);
});

app.get('/api/orders/:id', async (c) => {
  return c.json(await c.env.DB.prepare('SELECT * FROM preorder_orders WHERE id=?').bind(c.req.param('id')).first());
});

app.put('/api/orders/:id/status', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare('UPDATE preorder_orders SET status=? WHERE id=?').bind(b.status, c.req.param('id')).run();
  const o: any = await c.env.DB.prepare('SELECT * FROM preorder_orders WHERE id=?').bind(c.req.param('id')).first();
  if (o) await sendWhatsApp(c.env, o.customer_phone, `Statut commande ${o.receipt_number}: ${b.status}`);
  return c.json({ ok: true });
});

app.get('/api/receipt/:id', async (c) => {
  return c.json(await c.env.DB.prepare('SELECT * FROM receipts WHERE order_id=? OR id=?').bind(c.req.param('id'), c.req.param('id')).first());
});

app.get('/api/receipts', async (c) => {
  const q = c.req.query('q');
  let stmt = c.env.DB.prepare('SELECT * FROM receipts ORDER BY id DESC LIMIT 500');
  if (q) stmt = c.env.DB.prepare('SELECT * FROM receipts WHERE receipt_number LIKE ? ORDER BY id DESC').bind(`%${q}%`);
  return c.json((await stmt.all()).results);
});

app.get('/api/customers', async (c) => {
  const q = c.req.query('q');
  let stmt = c.env.DB.prepare('SELECT * FROM customers ORDER BY id DESC LIMIT 500');
  if (q) stmt = c.env.DB.prepare('SELECT * FROM customers WHERE phone LIKE ? OR name LIKE ? ORDER BY id DESC').bind(`%${q}%`, `%${q}%`);
  return c.json((await stmt.all()).results);
});

app.get('/api/customers/:phone', async (c) => {
  return c.json(await c.env.DB.prepare('SELECT * FROM customers WHERE phone=?').bind(c.req.param('phone')).first());
});

app.get('/api/inventory', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT i.*, p.product_name, p.sku, p.cost_price_xaf, p.unit_price_xaf
     FROM inventory i JOIN products p ON p.id=i.product_id ORDER BY i.qty_instock ASC`
  ).all();
  return c.json(rows.results);
});

app.post('/api/inventory/movement', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'INSERT INTO inventory_movements (product_id, type, qty, reference_id, created_by) VALUES (?, ?, ?, ?, ?)'
  ).bind(b.product_id, b.type, b.qty, b.reference_id ?? null, b.created_by ?? 'admin').run();
  const delta = ['IN', 'RETURN'].includes(b.type) ? b.qty : -b.qty;
  await c.env.DB.prepare('UPDATE inventory SET qty_instock = qty_instock + ? WHERE product_id=?').bind(delta, b.product_id).run();
  const inv: any = await c.env.DB.prepare('SELECT * FROM inventory WHERE product_id=?').bind(b.product_id).first();
  if (inv && inv.qty_instock <= inv.low_stock_alert) {
    await alertAdmin(c.env, `Stock bas: produit #${b.product_id} - reste ${inv.qty_instock}`);
  }
  return c.json({ ok: true });
});

app.get('/api/inventory/movements/:product_id', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM inventory_movements WHERE product_id=? ORDER BY id DESC LIMIT 200').bind(c.req.param('product_id')).all();
  return c.json(rows.results);
});

app.get('/api/dashboard/stats', async (c) => {
  try {
    const db = c.env.DB;
    const [leads, orders, revenue, customers, lowStock, groups] = await Promise.all([
      db.prepare('SELECT COUNT(*) c FROM leads').first<any>(),
      db.prepare('SELECT COUNT(*) c FROM preorder_orders').first<any>(),
      db.prepare('SELECT COALESCE(SUM(total_xaf),0) s FROM preorder_orders').first<any>(),
      db.prepare('SELECT COUNT(*) c FROM customers').first<any>(),
      db.prepare('SELECT COUNT(*) c FROM inventory WHERE qty_instock <= low_stock_alert').first<any>(),
      db.prepare("SELECT COUNT(*) c FROM preorder_groups WHERE status='OPEN'").first<any>()
    ]);
    return c.json({
      leads: leads?.c ?? 0, orders: orders?.c ?? 0, revenue: revenue?.s ?? 0,
      customers: customers?.c ?? 0, low_stock: lowStock?.c ?? 0, open_groups: groups?.c ?? 0
    });
  } catch (e: any) {
    return c.json({ leads: 0, orders: 0, revenue: 0, customers: 0, low_stock: 0, open_groups: 0, error: String(e?.message || e) });
  }
});

app.post('/api/upload', async (c) => {
  const form = await c.req.formData();
  const file = form.get('file') as File | null;
  const type = (form.get('type') as string) || 'photo';
  const orderId = form.get('order_id');
  const sourcingId = form.get('sourcing_id');
  const customerId = form.get('customer_id');
  if (!file) return c.json({ error: 'no file' }, 400);
  const key = `${type}/${Date.now()}-${file.name}`;
  await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  const url = `/api/file/${key}`;
  if (type !== 'temp') {
    await c.env.DB.prepare(
      'INSERT INTO project_files (order_id, sourcing_id, customer_id, file_url, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(orderId ?? null, sourcingId ?? null, customerId ?? null, url, type, 'client').run();
  }
  return c.json({ ok: true, url, key });
});

app.get('/api/file/*', async (c) => {
  const key = c.req.path.replace('/api/file/', '');
  const obj = await c.env.FILES.get(key);
  if (!obj) return c.text('not found', 404);
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' } });
});

app.get('/api/my-orders', async (c) => {
  const phone = c.req.query('phone');
  if (!phone) return c.json({});
  const orders = await c.env.DB.prepare(
    `SELECT o.*, g.title as group_title, g.status as group_status, g.eta_date
     FROM preorder_orders o LEFT JOIN preorder_groups g ON g.id=o.group_id
     WHERE o.customer_phone=? ORDER BY o.id DESC`
  ).bind(phone).all();
  const receipts = await c.env.DB.prepare('SELECT * FROM receipts WHERE customer_id=(SELECT id FROM customers WHERE phone=?) ORDER BY id DESC').bind(phone).all();
  const files = await c.env.DB.prepare('SELECT * FROM project_files WHERE customer_id=(SELECT id FROM customers WHERE phone=?) ORDER BY id DESC').bind(phone).all();
  const sourcing = await c.env.DB.prepare('SELECT * FROM sourcing_requests WHERE customer_phone=? ORDER BY id DESC').bind(phone).all();
  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE phone=?').bind(phone).first();
  const wallet = await c.env.DB.prepare('SELECT * FROM fidelity_wallet WHERE phone=?').bind(phone).first();
  return c.json({ orders: orders.results, receipts: receipts.results, files: files.results, sourcing: sourcing.results, customer, wallet });
});

app.post('/api/sourcing-request', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO sourcing_requests (customer_id, customer_phone, product_wanted, description, budget, files_json) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(b.customer_id ?? null, b.customer_phone, b.product_wanted, b.description ?? null, b.budget ?? null, JSON.stringify(b.files ?? [])).run();
  await alertAdmin(c.env, `Nouvelle demande sourcing: ${b.product_wanted} - ${b.customer_phone}`);
  await sendWhatsApp(c.env, b.customer_phone, `Nous avons recu votre demande "${b.product_wanted}".`);
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.get('/api/sourcing-requests', async (c) => {
  return c.json((await c.env.DB.prepare('SELECT * FROM sourcing_requests ORDER BY id DESC').all()).results);
});

app.put('/api/sourcing-requests/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE sourcing_requests SET status=COALESCE(?,status), quoted_price=COALESCE(?,quoted_price) WHERE id=?'
  ).bind(b.status ?? null, b.quoted_price ?? null, c.req.param('id')).run();
  if (b.status === 'quoted') {
    const s: any = await c.env.DB.prepare('SELECT * FROM sourcing_requests WHERE id=?').bind(c.req.param('id')).first();
    if (s) await sendWhatsApp(c.env, s.customer_phone, `Devis STARC.CM pour "${s.product_wanted}": ${Number(b.quoted_price).toLocaleString()} XAF`);
  }
  return c.json({ ok: true });
});

app.post('/api/whatsapp/send', async (c) => {
  const b = await c.req.json();
  return c.json(await sendWhatsApp(c.env, b.phone, b.message, b.mediaUrl));
});

app.post('/api/whatsapp/webhook', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const phone = body?.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') ?? body?.phone;
  const text = body?.data?.message?.conversation ?? body?.message ?? '';
  if (phone && text) {
    const cust: any = await c.env.DB.prepare('SELECT id FROM customers WHERE phone=?').bind(phone).first();
    if (cust) {
      await c.env.DB.prepare("INSERT INTO interactions (customer_id, type, notes, created_by) VALUES (?, 'whatsapp', ?, 'client')").bind(cust.id, text).run();
    }
    await logWhatsApp(c.env, phone, text, 'inbound', 'received');
  }
  return c.json({ ok: true });
});

app.get('/api/whatsapp/logs', async (c) => {
  return c.json((await c.env.DB.prepare('SELECT * FROM whatsapp_logs ORDER BY id DESC LIMIT 200').all()).results);
});

app.get('/api/delivery-zones', async (c) => {
  return c.json((await c.env.DB.prepare('SELECT * FROM delivery_zones').all()).results);
});

app.post('/api/delivery-zones', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare('INSERT INTO delivery_zones (city, fee) VALUES (?, ?) ON CONFLICT(city) DO UPDATE SET fee=excluded.fee').bind(b.city, b.fee).run();
  return c.json({ ok: true });
});

app.get('/api/team', async (c) => {
  return c.json((await c.env.DB.prepare('SELECT * FROM team_members').all()).results);
});

app.post('/api/team', async (c) => {
  const b = await c.req.json();
  const code = 'REC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const r = await c.env.DB.prepare(
    'INSERT INTO team_members (name, phone, role, assigned_group_id, commission_rate, referral_code) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(b.name, b.phone ?? null, b.role ?? 'recruiter', b.assigned_group_id ?? null, b.commission_rate ?? 5, code).run();
  return c.json({ ok: true, id: r.meta.last_row_id, referral_code: code });
});

app.get('/api/settings', async (c) => {
  return c.json({ shipping_rate: await getShippingRate(c.env), customs_rate: await getCustomsRate(c.env) });
});

app.post('/api/settings', async (c) => {
  const b = await c.req.json();
  if (b.shipping_rate) await c.env.KV.put('shipping_rate', String(b.shipping_rate));
  if (b.customs_rate) await c.env.KV.put('customs_rate', String(b.customs_rate));
  return c.json({ ok: true });
});

app.post('/api/auth/otp', async (c) => {
  const b = await c.req.json();
  if (b.otp !== '123456') return c.json({ ok: false, error: 'invalid' }, 401);
  return c.json({ ok: true });
});

export type AppType = typeof app;

// ============ ADMIN CMS: PRODUCTS ============
app.get('/api/admin/products', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM products ORDER BY id DESC').all();
  return c.json(rows.results);
});

app.post('/api/admin/products', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    `INSERT INTO products (product_name, sku, description, unit_price_xaf, cost_price_xaf, weight_kg, length_cm, width_cm, height_cm, cbm, customs_rate, image_url, category, is_instock, stock_qty, is_preorder, group_id, moq_needed, moq_current)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.product_name, b.sku, b.description ?? '', b.unit_price_xaf ?? 0, b.cost_price_xaf ?? 0,
    b.weight_kg ?? 0, b.length_cm ?? 0, b.width_cm ?? 0, b.height_cm ?? 0,
    ((b.length_cm ?? 0) * (b.width_cm ?? 0) * (b.height_cm ?? 0)) / 1000000,
    b.customs_rate ?? 32, b.image_url ?? '', b.category ?? 'General',
    b.is_instock ? 1 : 0, b.stock_qty ?? 0, b.is_preorder ? 1 : 0,
    b.group_id ?? null, b.moq_needed ?? 0, b.moq_current ?? 0
  ).run();
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.put('/api/admin/products/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE products SET product_name=?, sku=?, description=?, unit_price_xaf=?, cost_price_xaf=?, weight_kg=?, length_cm=?, width_cm=?, height_cm=?, cbm=?, customs_rate=?, image_url=?, category=?, is_instock=?, stock_qty=?, is_preorder=?, group_id=?, moq_needed=?, moq_current=? WHERE id=?`
  ).bind(
    b.product_name, b.sku, b.description ?? '', b.unit_price_xaf ?? 0, b.cost_price_xaf ?? 0,
    b.weight_kg ?? 0, b.length_cm ?? 0, b.width_cm ?? 0, b.height_cm ?? 0,
    ((b.length_cm ?? 0) * (b.width_cm ?? 0) * (b.height_cm ?? 0)) / 1000000,
    b.customs_rate ?? 32, b.image_url ?? '', b.category ?? 'General',
    b.is_instock ? 1 : 0, b.stock_qty ?? 0, b.is_preorder ? 1 : 0,
    b.group_id ?? null, b.moq_needed ?? 0, b.moq_current ?? 0, c.req.param('id')
  ).run();
  return c.json({ ok: true });
});

app.delete('/api/admin/products/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM products WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

// ============ ADMIN CMS: SERVICES ============
app.post('/api/admin/services', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO services (slug, title, description, image_url) VALUES (?, ?, ?, ?)'
  ).bind(b.slug, b.title, b.description ?? '', b.image_url ?? '').run();
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.put('/api/admin/services/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE services SET slug=?, title=?, description=?, image_url=? WHERE id=?'
  ).bind(b.slug, b.title, b.description ?? '', b.image_url ?? '', c.req.param('id')).run();
  return c.json({ ok: true });
});

app.delete('/api/admin/services/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM services WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

// ============ PUBLIC BLOG + ADMIN ============
app.get('/api/blog', async (c) => {
  try {
    const rows = await c.env.DB.prepare('SELECT id, slug, title, created_at FROM blog ORDER BY id DESC').all();
    return c.json(rows.results);
  } catch { return c.json([]); }
});

app.get('/api/blog/:slug', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM blog WHERE slug=?').bind(c.req.param('slug')).first();
  return c.json(row ?? {});
});

app.post('/api/admin/blog', async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(
    'INSERT INTO blog (slug, title, content) VALUES (?, ?, ?)'
  ).bind(b.slug, b.title, b.content ?? '').run();
  return c.json({ ok: true, id: r.meta.last_row_id });
});

app.put('/api/admin/blog/:id', async (c) => {
  const b = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE blog SET slug=?, title=?, content=? WHERE id=?'
  ).bind(b.slug, b.title, b.content ?? '', c.req.param('id')).run();
  return c.json({ ok: true });
});

app.delete('/api/admin/blog/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM blog WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

// ============ PAGES (HOMEPAGE HERO) STORED IN KV ============
const DEFAULT_HERO = {
  title: 'Achetez en gros depuis la Turquie, la Chine, Dubai.',
  subtitle: 'Groupage maritime & aerien - livraison Douala & Yaounde.',
  cta1_text: 'Explorer la boutique',
  cta1_link: '/shop',
  cta2_text: 'Voir les groupes',
  cta2_link: '/preorder'
};

app.get('/api/pages/home', async (c) => {
  const v = await c.env.KV.get('home_hero');
  return c.json(v ? JSON.parse(v) : DEFAULT_HERO);
});

app.put('/api/admin/pages/home', async (c) => {
  const b = await c.req.json();
  await c.env.KV.put('home_hero', JSON.stringify(b));
  return c.json({ ok: true });
});
