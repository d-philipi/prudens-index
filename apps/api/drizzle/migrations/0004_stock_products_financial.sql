ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS unit_price numeric(12, 4);
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS projected_revenue integer;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS tied_up_capital integer;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS lost_revenue integer;
