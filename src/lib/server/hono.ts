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

    // Generate unique receipt number STARC-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `STARC-${year}-`;
    const countRow: any = await DB.prepare(
      'SELECT COUNT(*) as c FROM preorder_orders WHERE receipt_number LIKE ?'
    ).bind(`${prefix}%`).first();
    const nextNum = (countRow?.c || 0) + 1;
    const receiptNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const now = new Date().toISOString();

    // Insert one row per item, all sharing the same receipt_number
    for (const item of body.items) {
      const id = crypto.randomUUID();
      await DB.prepare(
        `INSERT INTO preorder_orders (
          id, product_id, customer_name, customer_phone,
          quantity, unit_price_snapshot,
          delivery_fee, total_xaf,
          deposit_paid, remaining_xaf,
          payment_mode, payment_status,
          delivery_mode, delivery_address,
          receipt_number, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
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
    return c.json({ error: 'Erreur lors de la création de la commande', detail: e?.message }, 500);
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


app.all('*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404));
