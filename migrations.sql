PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL, email TEXT, city TEXT,
  type TEXT DEFAULT 'retail', total_orders INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0, kobo_balance REAL DEFAULT 0,
  recruiter_id INTEGER, referral_code TEXT UNIQUE, referred_by TEXT,
  created_at TEXT DEFAULT (datetime('now')), last_order_at TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  phone TEXT NOT NULL, email TEXT, service TEXT, message TEXT,
  status TEXT DEFAULT 'new', assigned_to INTEGER, source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER,
  type TEXT, notes TEXT, created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, description TEXT, image_url TEXT
);

CREATE TABLE IF NOT EXISTS blog (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, content TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_name TEXT NOT NULL,
  sku TEXT UNIQUE, description TEXT,
  unit_price_xaf REAL NOT NULL DEFAULT 0, cost_price_xaf REAL DEFAULT 0,
  weight_kg REAL NOT NULL, length_cm REAL NOT NULL,
  width_cm REAL NOT NULL, height_cm REAL NOT NULL, cbm REAL,
  customs_rate REAL DEFAULT 32, image_url TEXT, category TEXT,
  is_instock INTEGER DEFAULT 0, stock_qty INTEGER DEFAULT 0,
  is_preorder INTEGER DEFAULT 0, group_id INTEGER,
  moq_needed INTEGER DEFAULT 0, moq_current INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL,
  warehouse TEXT DEFAULT 'Douala-Makepe',
  qty_instock INTEGER DEFAULT 0, qty_reserved INTEGER DEFAULT 0,
  qty_sold INTEGER DEFAULT 0, low_stock_alert INTEGER DEFAULT 5,
  last_restock_at TEXT, UNIQUE(product_id, warehouse)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL,
  type TEXT NOT NULL, qty INTEGER NOT NULL,
  from_status TEXT, to_status TEXT, reference_id TEXT,
  created_by TEXT, created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS preorder_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
  origin_country TEXT, shipping_mode TEXT DEFAULT 'AIR',
  closing_date TEXT, eta_date TEXT, status TEXT DEFAULT 'OPEN',
  total_weight_kg REAL DEFAULT 0, total_cbm REAL DEFAULT 0,
  shipping_cost_per_kg REAL DEFAULT 2500, shipping_cost_total REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS preorder_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER, product_id INTEGER,
  customer_id INTEGER, customer_name TEXT, customer_phone TEXT,
  quantity INTEGER DEFAULT 1, unit_price_snapshot REAL,
  shipping_share_xaf REAL DEFAULT 0, customs_share_xaf REAL DEFAULT 0,
  delivery_fee REAL DEFAULT 0, total_xaf REAL DEFAULT 0,
  deposit_paid REAL DEFAULT 0, remaining_xaf REAL DEFAULT 0,
  payment_mode TEXT DEFAULT 'DEPOSIT_30',
  payment_status TEXT DEFAULT 'PENDING',
  delivery_mode TEXT DEFAULT 'pickup', delivery_address TEXT,
  recruiter_id INTEGER, insurance INTEGER DEFAULT 0,
  receipt_number TEXT, status TEXT DEFAULT 'PENDING',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL, order_id INTEGER,
  customer_id INTEGER, type TEXT, items_json TEXT,
  subtotal REAL DEFAULT 0, shipping_total REAL DEFAULT 0,
  customs_total REAL DEFAULT 0, insurance_total REAL DEFAULT 0,
  delivery_total REAL DEFAULT 0, total_xaf REAL DEFAULT 0,
  paid_xaf REAL DEFAULT 0, remaining_xaf REAL DEFAULT 0,
  payment_method TEXT, group_info_json TEXT, qr_code TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sourcing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER,
  customer_phone TEXT, product_wanted TEXT, description TEXT,
  budget REAL, files_json TEXT, status TEXT DEFAULT 'new',
  quoted_price REAL, created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER,
  sourcing_id INTEGER, customer_id INTEGER, file_url TEXT,
  file_type TEXT, uploaded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  phone TEXT, role TEXT DEFAULT 'recruiter',
  assigned_group_id INTEGER, commission_rate REAL DEFAULT 5,
  referral_code TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS fidelity_wallet (
  phone TEXT PRIMARY KEY, kobo_balance REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT UNIQUE NOT NULL, fee REAL DEFAULT 2000
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, message TEXT,
  type TEXT, status TEXT, created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_group ON products(group_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON preorder_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_group ON preorder_orders(group_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
