import '../src/lib/load-env.js';

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../drizzle/migrations');

const db = postgres(
  process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
);

async function tableExists(name: string): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

async function shouldRun(file: string): Promise<boolean> {
  if (file === '0000_init.sql') {
    return !(await tableExists('companies'));
  }
  if (file === '0001_align_stock_products.sql') {
    return !(await columnExists('stock_products', 'stores_with_stock'));
  }
  if (file === '0002_import_validation_errors.sql') {
    return !(await columnExists('import_jobs', 'validation_errors'));
  }
  if (file === '0003_company_cadastro.sql') {
    return !(await columnExists('companies', 'cnpj'));
  }
  if (file === '0004_stock_products_financial.sql') {
    return !(await columnExists('stock_products', 'unit_price'));
  }
  if (file === '0005_stock_item_status_v2.sql') {
    const rows = await db<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status_v2') AS exists
    `;
    return !(rows[0]?.exists ?? false);
  }
  if (file === '0006_add_action_insight.sql') {
    return !(await columnExists('stock_products', 'action_insight'));
  }
  return true;
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  if (!(await shouldRun(file))) {
    console.log(`Skip ${file} (already applied)`);
    continue;
  }
  const sqlText = readFileSync(join(migrationsDir, file), 'utf8');
  console.log(`Applying ${file}...`);
  await db.unsafe(sqlText);
  console.log(`Applied ${file}`);
}

console.log('Migrations complete');
await db.end();
