import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
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

// ═══════════ AUTH ═══════════
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json() as any;
    const phone = String(body.phone || '').replace(/\D/g, '');
    const name = String(body.name || '').trim();

    if (phone.length < 8) return c.json({ error: 'Numéro invalide' }, 400);

    const DB = c.get('runtime').DB!;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30j

    // Cherche ou crée le client
    let customer: any = await DB.prepare('SELECT * FROM customers WHERE phone = ?').bind(phone).first();
    let isNew = false;

    if (!customer) {
      if (!name) return c.json({ error: 'Nom requis pour créer un compte', needs_name: true }, 400);
      const referralCode = 'STARC-' + phone.slice(-4) + Math.random().toString(36).slice(2, 5).toUpperCase();
      const res: any = await DB.prepare(
        `INSERT INTO customers (name, phone, referral_code, created_at) VALUES (?, ?, ?, ?)`
      ).bind(name, phone, referralCode, now).run();
      const newId = res.meta?.last_row_id;
      customer = await DB.prepare('SELECT * FROM customers WHERE id = ?').bind(newId).first();
      isNew = true;
    } else if (name && !customer.name) {
      await DB.prepare('UPDATE customers SET name = ? WHERE id = ?').bind(name, customer.id).run();
      customer.name = name;
    }

    // Crée la session
    const token = crypto.randomUUID();
    await DB.prepare('INSERT INTO sessions (token, phone, expires_at) VALUES (?, ?, ?)')
      .bind(token, phone, expiresAt).run();

    setCookie(c, 'starc_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return c.json({
      success: true,
      is_new: isNew,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        kobo_balance: customer.kobo_balance,
        referral_code: customer.referral_code
      }
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  try {
    const token = getCookie(c, 'starc_session');
    if (!token) return c.json({ error: 'Non connecté' }, 401);

    const DB = c.get('runtime').DB!;
    const session: any = await DB.prepare(
      'SELECT phone, expires_at FROM sessions WHERE token = ?'
    ).bind(token).first();

    if (!session) return c.json({ error: 'Session invalide' }, 401);
    if (new Date(session.expires_at) < new Date()) {
      await DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return c.json({ error: 'Session expirée' }, 401);
    }

    const customer: any = await DB.prepare('SELECT * FROM customers WHERE phone = ?').bind(session.phone).first();
    if (!customer) return c.json({ error: 'Client introuvable' }, 401);

    return c.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      kobo_balance: customer.kobo_balance || 0,
      referral_code: customer.referral_code,
      total_orders: customer.total_orders || 0,
      total_spent: customer.total_spent || 0,
      created_at: customer.created_at
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.post('/api/auth/logout', async (c) => {
  try {
    const token = getCookie(c, 'starc_session');
    if (token) {
      const DB = c.get('runtime').DB!;
      await DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    deleteCookie(c, 'starc_session', { path: '/' });
    return c.json({ success: true });
  } catch {
    return c.json({ success: true });
  }
});

// ═══════════ MY ACCOUNT ═══════════
app.get('/api/my/orders', async (c) => {
  try {
    const token = getCookie(c, 'starc_session');
    if (!token) return c.json({ error: 'Non connecté' }, 401);

    const DB = c.get('runtime').DB!;
    const session: any = await DB.prepare('SELECT phone FROM sessions WHERE token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session invalide' }, 401);

    const rows: any = await DB.prepare(
      `SELECT o.*, p.product_name, p.image_url
       FROM preorder_orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.customer_phone = ?
       ORDER BY o.created_at DESC`
    ).bind(session.phone).all();

    // Groupe par receipt_number
    const grouped: Record<string, any> = {};
    for (const r of rows?.results || []) {
      const key = r.receipt_number || `row-${r.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          receipt_number: r.receipt_number,
          status: r.status,
          payment_status: r.payment_status,
          payment_mode: r.payment_mode,
          delivery_mode: r.delivery_mode,
          created_at: r.created_at,
          total: 0, deposit: 0, remaining: 0,
          items: []
        };
      }
      grouped[key].total += r.total_xaf || 0;
      grouped[key].deposit += r.deposit_paid || 0;
      grouped[key].remaining += r.remaining_xaf || 0;
      grouped[key].items.push({
        product_id: r.product_id,
        product_name: r.product_name,
        image_url: r.image_url,
        quantity: r.quantity,
        unit_price: r.unit_price_snapshot
      });
    }

    return c.json(Object.values(grouped));
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.get('/api/my/kobo', async (c) => {
  try {
    const token = getCookie(c, 'starc_session');
    if (!token) return c.json({ error: 'Non connecté' }, 401);

    const DB = c.get('runtime').DB!;
    const session: any = await DB.prepare('SELECT phone FROM sessions WHERE token = ?').bind(token).first();
    if (!session) return c.json({ error: 'Session invalide' }, 401);

    const customer: any = await DB.prepare('SELECT kobo_balance FROM customers WHERE phone = ?').bind(session.phone).first();
    const txns: any = await DB.prepare(
      'SELECT * FROM kobo_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(String(customer?.id || '')).all();

    return c.json({
      balance: customer?.kobo_balance || 0,
      transactions: txns?.results || []
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.get('/api/track/by-phone/:phone', async (c) => {
  try {
    const phone = String(c.req.param('phone') || '').replace(/\D/g, '');
    if (phone.length < 8) return c.json({ error: 'Numéro invalide' }, 400);

    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      'SELECT * FROM preorder_orders WHERE customer_phone = ? ORDER BY created_at DESC'
    ).bind(phone).all();

    if (!rows?.results?.length) {
      return c.json({ orders: [] });
    }

    // Groupe par receipt_number
    const grouped: Record<string, any> = {};
    for (const r of rows.results) {
      const key = r.receipt_number || `row-${r.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          receipt_number: r.receipt_number,
          status: r.status,
          payment_status: r.payment_status,
          payment_mode: r.payment_mode,
          delivery_mode: r.delivery_mode,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          created_at: r.created_at,
          total: 0, deposit: 0, remaining: 0,
          items: []
        };
      }
      grouped[key].total += r.total_xaf || 0;
      grouped[key].deposit += r.deposit_paid || 0;
      grouped[key].remaining += r.remaining_xaf || 0;
      grouped[key].items.push({
        product_id: r.product_id,
        quantity: r.quantity,
        unit_price: r.unit_price_snapshot,
        line_total: r.total_xaf
      });
    }

    return c.json({ orders: Object.values(grouped) });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.post('/api/sourcing-requests', async (c) => {
  try {
    const body = await c.req.json() as any;
    const phone = String(body.customer_phone || '').replace(/\D/g, '');
    const product = String(body.product_wanted || '').trim();

    if (phone.length < 8) return c.json({ error: 'Numéro invalide' }, 400);
    if (!product) return c.json({ error: 'Produit requis' }, 400);

    const DB = c.get('runtime').DB!;
    const now = new Date().toISOString();

    // Ajoute le nom du demandeur dans la description si fourni
    let description = String(body.description || '');
    if (body.customer_name) {
      description = `Demandeur: ${body.customer_name}\n${description}`;
    }

    const res: any = await DB.prepare(
      `INSERT INTO sourcing_requests (
        customer_phone, product_wanted, description, budget,
        files_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      phone,
      product,
      description,
      body.budget ? Number(body.budget) : null,
      '[]',
      'new',
      now
    ).run();

    const newId = res.meta?.last_row_id;
    const ref = 'SRC-' + String(newId || Date.now()).padStart(6, '0');

    return c.json({
      success: true,
      id: ref,
      row_id: newId,
      created_at: now
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

app.get('/api/sourcing-requests', async (c) => {
  try {
    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      'SELECT * FROM sourcing_requests ORDER BY created_at DESC LIMIT 100'
    ).all();
    return c.json(rows?.results || []);
  } catch (e: any) {
    return c.json({ error: 'Erreur serveur', detail: e?.message }, 500);
  }
});

// ═══════════ ADMIN ═══════════
const ADMIN_PASSWORD = 'STARC2026!';
const ADMIN_COOKIE = 'starc_admin';

function checkAdmin(c: any): boolean {
  const val = getCookie(c, ADMIN_COOKIE);
  return val === ADMIN_PASSWORD;
}

app.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json() as any;
    if (body?.password !== ADMIN_PASSWORD) {
      return c.json({ error: 'Mot de passe invalide' }, 401);
    }
    setCookie(c, ADMIN_COOKIE, ADMIN_PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Erreur' }, 500);
  }
});

app.post('/api/admin/logout', async (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' });
  return c.json({ success: true });
});

app.get('/api/admin/check', async (c) => {
  return c.json({ authenticated: checkAdmin(c) });
});

app.get('/api/admin/stats', async (c) => {
  if (!checkAdmin(c)) return c.json({ error: 'Non autorisé' }, 401);
  try {
    const DB = c.get('runtime').DB!;

    const [
      ordersCount, customersCount, sourcingCount, abandonedCount,
      ordersRevenue, cartLeadsValue, recentOrders, recentSourcing
    ] = await Promise.all([
      DB.prepare('SELECT COUNT(DISTINCT receipt_number) as c FROM preorder_orders').first(),
      DB.prepare('SELECT COUNT(*) as c FROM customers').first(),
      DB.prepare("SELECT COUNT(*) as c FROM sourcing_requests WHERE status = 'new'").first(),
      DB.prepare('SELECT COUNT(*) as c FROM cart_leads').first(),
      DB.prepare('SELECT SUM(deposit_paid) as s FROM preorder_orders').first(),
      DB.prepare('SELECT SUM(total_xaf) as s FROM cart_leads').first(),
      DB.prepare('SELECT receipt_number, customer_name, total_xaf, deposit_paid, status, created_at FROM preorder_orders ORDER BY created_at DESC LIMIT 5').all(),
      DB.prepare('SELECT id, customer_phone, product_wanted, status, created_at FROM sourcing_requests ORDER BY created_at DESC LIMIT 5').all()
    ]) as any[];

    return c.json({
      stats: {
        total_orders: (ordersCount as any)?.c || 0,
        total_customers: (customersCount as any)?.c || 0,
        new_sourcing: (sourcingCount as any)?.c || 0,
        abandoned_carts: (abandonedCount as any)?.c || 0,
        total_revenue: (ordersRevenue as any)?.s || 0,
        abandoned_value: (cartLeadsValue as any)?.s || 0
      },
      recent_orders: (recentOrders as any)?.results || [],
      recent_sourcing: (recentSourcing as any)?.results || []
    });
  } catch (e: any) {
    return c.json({ error: 'Erreur', detail: e?.message }, 500);
  }
});

app.get('/api/admin/sourcing-leads', async (c) => {
  if (!checkAdmin(c)) return c.json({ error: 'Non autorisé' }, 401);
  try {
    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      'SELECT * FROM sourcing_requests ORDER BY created_at DESC LIMIT 200'
    ).all();
    return c.json(rows?.results || []);
  } catch (e: any) {
    return c.json({ error: 'Erreur', detail: e?.message }, 500);
  }
});

app.get('/api/admin/cart-leads', async (c) => {
  if (!checkAdmin(c)) return c.json({ error: 'Non autorisé' }, 401);
  try {
    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      "SELECT * FROM cart_leads WHERE customer_phone != '' ORDER BY last_activity_at DESC LIMIT 200"
    ).all();
    return c.json(rows?.results || []);
  } catch (e: any) {
    return c.json({ error: 'Erreur', detail: e?.message }, 500);
  }
});

app.get('/api/admin/orders', async (c) => {
  if (!checkAdmin(c)) return c.json({ error: 'Non autorisé' }, 401);
  try {
    const DB = c.get('runtime').DB!;
    const rows: any = await DB.prepare(
      `SELECT o.*, p.product_name, p.image_url
       FROM preorder_orders o
       LEFT JOIN products p ON o.product_id = p.id
       ORDER BY o.created_at DESC
       LIMIT 300`
    ).all();

    // Group by receipt
    const grouped: Record<string, any> = {};
    for (const r of rows?.results || []) {
      const key = r.receipt_number || `row-${r.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          receipt_number: r.receipt_number,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          status: r.status,
          payment_status: r.payment_status,
          payment_mode: r.payment_mode,
          delivery_mode: r.delivery_mode,
          delivery_address: r.delivery_address,
          created_at: r.created_at,
          total: 0, deposit: 0, remaining: 0,
          items: []
        };
      }
      grouped[key].total += r.total_xaf || 0;
      grouped[key].deposit += r.deposit_paid || 0;
      grouped[key].remaining += r.remaining_xaf || 0;
      grouped[key].items.push({
        product_id: r.product_id,
        product_name: r.product_name,
        image_url: r.image_url,
        quantity: r.quantity,
        unit_price: r.unit_price_snapshot
      });
    }

    return c.json(Object.values(grouped));
  } catch (e: any) {
    return c.json({ error: 'Erreur', detail: e?.message }, 500);
  }
});

app.all('*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404));
