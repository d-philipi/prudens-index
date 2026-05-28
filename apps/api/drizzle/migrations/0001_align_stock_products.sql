ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS stores_with_stock integer;

UPDATE stock_products SET stores_with_stock = COALESCE(
  CASE
    WHEN jsonb_typeof(branches_with_stock) = 'array' THEN jsonb_array_length(branches_with_stock)
    ELSE NULL
  END,
  0
);

ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS branches_with_demand_int integer;

UPDATE stock_products SET branches_with_demand_int = COALESCE(
  CASE
    WHEN jsonb_typeof(branches_with_demand) = 'array' THEN jsonb_array_length(branches_with_demand)
    ELSE NULL
  END,
  0
);

ALTER TABLE stock_products RENAME COLUMN avg_demand TO average_demand;

ALTER TABLE stock_products ALTER COLUMN stock TYPE integer USING ROUND(stock)::integer;

ALTER TABLE stock_products ADD COLUMN item_status_new text;

UPDATE stock_products SET item_status_new = CASE
  WHEN idd IS NULL THEN 'adequate'
  WHEN idd::numeric < 0 THEN 'distribution'
  WHEN idd::numeric <= 20 THEN 'adequate'
  ELSE 'boost'
END;

ALTER TABLE stock_products DROP COLUMN item_status;
ALTER TABLE stock_products RENAME COLUMN item_status_new TO item_status;
ALTER TABLE stock_products ALTER COLUMN item_status SET NOT NULL;

ALTER TABLE stock_products DROP COLUMN branches_with_demand;
ALTER TABLE stock_products RENAME COLUMN branches_with_demand_int TO branches_with_demand;
ALTER TABLE stock_products ALTER COLUMN branches_with_demand SET DEFAULT 0;
ALTER TABLE stock_products ALTER COLUMN branches_with_demand SET NOT NULL;

ALTER TABLE stock_products DROP COLUMN branches_with_stock;
ALTER TABLE stock_products ALTER COLUMN stores_with_stock SET DEFAULT 0;
ALTER TABLE stock_products ALTER COLUMN stores_with_stock SET NOT NULL;

UPDATE stock_products SET idd = 0 WHERE idd IS NULL;
ALTER TABLE stock_products ALTER COLUMN idd SET NOT NULL;

ALTER TABLE stock_products ADD CONSTRAINT stock_products_item_status_check
  CHECK (item_status IN ('distribution', 'adequate', 'boost'));

DROP TYPE IF EXISTS item_status;
ALTER TABLE stock_products DROP COLUMN IF EXISTS category;

DROP INDEX IF EXISTS stock_products_company_status;
CREATE INDEX stock_products_company_status ON stock_products (company_id, item_status);
