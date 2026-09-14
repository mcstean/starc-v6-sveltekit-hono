INSERT INTO preorder_groups (title, origin_country, shipping_mode, closing_date, eta_date, status, shipping_cost_per_kg)
VALUES ('Turkey Tools - SEA Group #1', 'Turkey', 'SEA', '2026-02-28', '2026-03-30', 'OPEN', 2500);

INSERT INTO products (product_name, sku, description, unit_price_xaf, cost_price_xaf, weight_kg, length_cm, width_cm, height_cm, cbm, customs_rate, category, is_instock, stock_qty, is_preorder, group_id, moq_needed, moq_current, image_url)
VALUES
('Bosch GSB 13 RE Impact Drill', 'TR-DRL-001', 'Professional impact drill 600W', 45000, 32000, 2.4, 30, 20, 15, 0.009, 32, 'Power Tools', 0, 0, 1, 1, 50, 12, ''),
('Makita Angle Grinder 720W', 'TR-GRN-002', 'Angle grinder 115mm', 38000, 27000, 2.1, 28, 18, 14, 0.0071, 32, 'Power Tools', 0, 0, 1, 1, 40, 8, ''),
('Ingco 88pc Tool Kit', 'TR-KIT-003', 'Complete mechanic tool set', 29000, 19500, 3.2, 40, 25, 12, 0.012, 32, 'Hand Tools', 0, 0, 1, 1, 60, 5, ''),
('Ingco Rotary Hammer 1500W', 'TR-HAM-004', 'Instock rotary hammer', 62000, 44000, 3.6, 42, 24, 13, 0.0131, 32, 'Power Tools', 1, 15, 0, NULL, 0, 0, '');

INSERT INTO inventory (product_id, warehouse, qty_instock, qty_reserved, qty_sold, low_stock_alert)
SELECT id, 'Douala-Makepe', 15, 0, 0, 5 FROM products WHERE sku='TR-HAM-004';

INSERT INTO delivery_zones (city, fee) VALUES ('Douala', 2000), ('Yaounde', 3000);

INSERT INTO services (slug, title, description, image_url) VALUES
('sourcing', 'Sourcing & Achat', 'Nous trouvons et achetons vos produits a l''etranger', ''),
('groupage', 'Groupage Maritime', 'Commande groupee conteneur SEA', ''),
('air', 'Fret Aerien', 'Livraison rapide par avion', ''),
('livraison', 'Livraison Cameroun', 'Douala et Yaounde', '');

INSERT INTO team_members (name, phone, role, commission_rate, referral_code)
VALUES ('Admin STARC', '237600000000', 'recruiter', 5, 'STARC-ADMIN');
