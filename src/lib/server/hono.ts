import { Hono } from 'hono';
import type { Env } from '$lib/db';
import { env as railwayEnv } from './env';

export const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
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
    const v = await railwayEnv.KV.get('home_hero');
    return c.json(v ? JSON.parse(v) : DEFAULT_HERO);
  } catch { return c.json(DEFAULT_HERO); }
});
app.get('/api/products', async (c) => {
  try { const rows = await railwayEnv.DB.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 100').all(); return c.json(rows); } catch { return c.json([]); }
});
app.get('/api/services', async (c) => {
  try { const rows = await railwayEnv.DB.prepare('SELECT * FROM services ORDER BY id ASC').all(); return c.json(rows); } catch { return c.json([]); }
});
app.get('/api/groups', async (c) => {
  try { const rows = await railwayEnv.DB.prepare("SELECT * FROM groups WHERE status = 'open' ORDER BY departure_date ASC").all(); return c.json(rows); } catch { return c.json([]); }
});
app.get('/api/dashboard/stats', async (c) => {
  try {
    const leads = await railwayEnv.DB.prepare('SELECT COUNT(*) as count FROM leads').first() as any;
    const orders = await railwayEnv.DB.prepare('SELECT COUNT(*) as count FROM orders').first() as any;
    return c.json({ leads: leads?.count||0, orders: orders?.count||0, revenue:0, customers:0, low_stock:0, open_groups:0 });
  } catch { return c.json({ leads:0, orders:0, revenue:0, customers:0, low_stock:0, open_groups:0 }); }
});
app.all('*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404));
