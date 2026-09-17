import { Hono } from 'hono';
import { createEnv } from './env';

type Variables = { runtime: ReturnType<typeof createEnv> };

export const app = new Hono<{ Bindings: any; Variables: Variables }>();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  c.set('runtime', createEnv(c.env as Record<string, any>));
  await next();
});

const DEFAULT_HERO = {
  title: 'Votre boutique invisible ne vend pas. On vous rend visible, puis on vous fait importer moins cher.',
  subtitle: 'Plateforme de facilitation Douala - On commence par vous rendre trouvable sur Google Maps, puis on vous regroupe pour importer ensemble.',
  cta1_text: 'Devenir Visible sur Google',
  cta1_link: '/visibility',
  cta2_text: 'Voir Groupes Ouverts',
  cta2_link: '/shop'
};

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.get('/api/pages/home', async (c) => {
  try {
    const row = await c.get('runtime').DB!
      .prepare("SELECT value FROM settings WHERE key='home_hero'")
      .first<{ value: string }>();
    return c.json(row?.value ? JSON.parse(row.value) : DEFAULT_HERO);
  } catch { return c.json(DEFAULT_HERO); }
});

app.get('/api/products', async (c) => {
  try {
    const r = await c.get('runtime').DB!
      .prepare('SELECT * FROM products ORDER BY id DESC LIMIT 100')
      .all();
    return c.json(r.results ?? []);
  } catch { return c.json([]); }
});

app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const p = await c.get('runtime').DB!
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first();
    if (!p) return c.json({ error: 'Produit introuvable' }, 404);
    return c.json(p);
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.get('/api/services', async (c) => {
  try {
    const r = await c.get('runtime').DB!
      .prepare('SELECT * FROM services ORDER BY id ASC')
      .all();
    return c.json(r.results ?? []);
  } catch { return c.json([]); }
});

app.get('/api/groups', async (c) => {
  try {
    const r = await c.get('runtime').DB!
      .prepare("SELECT * FROM preorder_groups WHERE status = 'OPEN' ORDER BY closing_date ASC")
      .all();
    return c.json(r.results ?? []);
  } catch { return c.json([]); }
});

app.post('/api/orders', async (c) => {
  try {
    const body = await c.req.json() as any;
    const DB = c.get('runtime').DB!;

    if (!body?.items?.length) {
      return c.json({ error: 'Panier vide' }, 400);
    }
    if (!body.customer_name || !body.customer_phone) {
      return c.json({ error: 'Nom et téléphone obligatoires' }, 400);
    }

    // Génère un numéro de reçu unique STARC-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `STARC-${year}-`;
    const countRow: any = await DB.prepare(
      'SELECT COUNT(*) as c FROM preorder_orders WHERE receipt_number LIKE ?'
    ).bind(`${prefix}%`).first();
    const nextNum = (countRow?.c || 0) + 1;
    const receiptNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const now = new Date().toISOString();

    // Un INSERT par ligne du panier — même receipt_number pour toutes
    // On n'insère PAS l'id (SQLite l'auto-génère car INTEGER PRIMARY KEY AUTOINCREMENT)
    for (const item of body.items) {
      await DB.prepare(
        `INSERT INTO preorder_orders (
          product_id, customer_name, customer_phone,
          quantity, unit_price_snapshot,
          delivery_fee, total_xaf,
          deposit_paid, remaining_xaf,
          payment_mode, payment_status,
          delivery_mode, delivery_address,
          receipt_number, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        item.product_id || null,
        body.customer_name,
        body.customer_phone,
        item.qty || 1,
        item.unit_price || 0,
        body.shipping_fee || 0,
        (item.unit_price || 0) * (item.qty || 1),
        body.deposit_paid || 0,
        body.remaining || 0,
        body.payment_mode || 'DEPOSIT_30',
        'PENDING',
        body.delivery_mode || 'pickup',
        body.delivery_address || '',
        receiptNumber,
        'PENDING',
        now
      ).run();
    }

    // Supprime le cart lead associé (la commande est confirmée)
    if (body.session_id) {
      try {
        await DB.prepare('DELETE FROM cart_leads WHERE session_id = ?').bind(body.session_id).run();
      } catch {}
    }

    return c.json({
      success: true,
      receipt_number: receiptNumber,
      total: body.total_price || 0,
      deposit: body.deposit_paid || 0,
      remaining: body.remaining || 0,
      items_count: body.items.length,
      created_at: now
    });
  } catch (e: any) {
    return c.json({
      error: 'Erreur lors de la création de la commande',
      detail: e?.message ?? String(e),
      stack: String(e?.stack ?? '').split('\n').slice(0, 5)
    }, 500);
  }
});

app.get('/api/dashboard/stats', async (c) => {
  const empty = { leads: 0, orders: 0, revenue: 0, customers: 0, low_stock: 0, open_groups: 0 };
  try {
    const DB = c.get('runtime').DB!;
    const leads = await DB.prepare('SELECT COUNT(*) as count FROM leads').first() as any;
    const orders = await DB.prepare('SELECT COUNT(*) as count FROM preorder_orders').first() as any;
    const customers = await DB.prepare('SELECT COUNT(*) as count FROM customers').first() as any;
    const groups = await DB.prepare("SELECT COUNT(*) as count FROM preorder_groups WHERE status='OPEN'").first() as any;
    return c.json({
      leads: leads?.count || 0,
      orders: orders?.count || 0,
      customers: customers?.count || 0,
      open_groups: groups?.count || 0,
      revenue: 0,
      low_stock: 0
    });
  } catch { return c.json(empty); }
});


// ───── Récupère un reçu par numéro (STARC-YYYY-NNNN) ─────
app.get('/api/receipts/:receipt', async (c) => {
  try {
    const receiptNumber = c.req.param('receipt');
    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      'SELECT * FROM preorder_orders WHERE receipt_number = ? ORDER BY id ASC'
    ).bind(receiptNumber).all();

    if (!rows?.results?.length) {
      return c.json({ error: 'Reçu introuvable' }, 404);
    }

    const first = rows.results[0];
    const items = rows.results.map((r: any) => ({
      product_id: r.product_id,
      quantity: r.quantity,
      unit_price: r.unit_price_snapshot,
      line_total: r.total_xaf,
      deposit_paid: r.deposit_paid,
      remaining: r.remaining_xaf
    }));

    return c.json({
      receipt_number: first.receipt_number,
      customer_name: first.customer_name,
      customer_phone: first.customer_phone,
      delivery_mode: first.delivery_mode,
      delivery_address: first.delivery_address,
      payment_mode: first.payment_mode,
      payment_status: first.payment_status,
      status: first.status,
      created_at: first.created_at,
      items,
      items_count: items.length,
      total: rows.results.reduce((sum: number, r: any) => sum + (r.total_xaf || 0), 0),
      deposit: rows.results.reduce((sum: number, r: any) => sum + (r.deposit_paid || 0), 0),
      remaining: rows.results.reduce((sum: number, r: any) => sum + (r.remaining_xaf || 0), 0)
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

// ───── Upsert un cart lead (panier en cours) ─────
app.post('/api/cart-leads', async (c) => {
  try {
    const body = await c.req.json() as any;
    const DB = c.get('runtime').DB!;
    if (!body?.session_id) return c.json({ error: 'session_id requis' }, 400);

    const now = new Date().toISOString();
    const existing: any = await DB.prepare(
      'SELECT id FROM cart_leads WHERE session_id = ?'
    ).bind(body.session_id).first();

    const cartJson = JSON.stringify(body.items || []);
    const totalXaf = body.total_xaf || 0;
    const itemsCount = (body.items || []).length;

    if (existing?.id) {
      await DB.prepare(
        `UPDATE cart_leads SET customer_name=?, customer_phone=?, customer_email=?,
         cart_json=?, total_xaf=?, items_count=?, stage=?, last_activity_at=?
         WHERE session_id=?`
      ).bind(
        body.customer_name || '', body.customer_phone || '', body.customer_email || '',
        cartJson, totalXaf, itemsCount, body.stage || 'contact', now, body.session_id
      ).run();
      return c.json({ success: true, action: 'updated', session_id: body.session_id });
    }

    await DB.prepare(
      `INSERT INTO cart_leads (id, session_id, customer_name, customer_phone, customer_email,
       cart_json, total_xaf, items_count, stage, last_activity_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), body.session_id,
      body.customer_name || '', body.customer_phone || '', body.customer_email || '',
      cartJson, totalXaf, itemsCount, body.stage || 'contact', now, now
    ).run();
    return c.json({ success: true, action: 'created', session_id: body.session_id });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.all('*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404));
