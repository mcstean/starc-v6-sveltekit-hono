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
