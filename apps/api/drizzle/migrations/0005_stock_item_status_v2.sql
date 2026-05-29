CREATE TYPE item_status_v2 AS ENUM (
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated'
);

ALTER TABLE stock_products ADD COLUMN item_status_new item_status_v2;

UPDATE stock_products SET item_status_new = 'healthy'::item_status_v2;

ALTER TABLE stock_products DROP CONSTRAINT IF EXISTS stock_products_item_status_check;

ALTER TABLE stock_products DROP COLUMN item_status;

ALTER TABLE stock_products RENAME COLUMN item_status_new TO item_status;

ALTER TABLE stock_products ALTER COLUMN item_status SET NOT NULL;

DROP TYPE IF EXISTS item_status;

DROP INDEX IF EXISTS stock_products_company_status;
CREATE INDEX stock_products_company_status ON stock_products (company_id, item_status);
