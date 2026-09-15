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
  title: 'Achetez en gros depuis la Turquie, la Chine, Dubai.',
  subtitle: 'Rejoignez nos groupages hebdomadaires et réduisez vos coûts de transport.',
  cta_primary: 'Voir les groupes ouverts',
  cta_secondary: 'Comment ça marche'
};

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.get('/api/pages/home', async (c) => {
  try {
    const v = await c.get('runtime').KV.get('home_hero');
    return c.json(v ? JSON.parse(v) : DEFAULT_HERO);
  } catch { return c.json(DEFAULT_HERO); }
});

app.get('/api/products', async (c) => {
  try { const rows = await c.get('runtime').DB.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 100').all(); return c.json(rows); }
  catch { return c.json([]); }
});

app.get('/api/services', async (c) => {
  try { const rows = await c.get('runtime').DB.prepare('SELECT * FROM services ORDER BY id ASC').all(); return c.json(rows); }
  catch { return c.json([]); }
});

app.get('/api/groups', async (c) => {
  try { const rows = await c.get('runtime').DB.prepare("SELECT * FROM groups WHERE status = 'open' ORDER BY departure_date ASC").all(); return c.json(rows); }
  catch { return c.json([]); }
});

app.get('/api/dashboard/stats', async (c) => {
  const empty = { leads: 0, orders: 0, revenue: 0, customers: 0, low_stock: 0, open_groups: 0 };
  try {
    const DB = c.get('runtime').DB;
    const leads = (await DB.prepare('SELECT COUNT(*) as count FROM leads').first()) as any;
    const orders = (await DB.prepare('SELECT COUNT(*) as count FROM orders').first()) as any;
    return c.json({ ...empty, leads: leads?.count || 0, orders: orders?.count || 0 });
  } catch { return c.json(empty); }
});

app.all('*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404));
