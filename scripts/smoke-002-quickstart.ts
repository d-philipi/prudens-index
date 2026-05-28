/**
 * Automated checks for specs/002-align-stock-dashboards/quickstart.md
 * Run: pnpm smoke:002 (repo root)
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../apps/api/package.json'));
const postgres = require('postgres') as typeof import('postgres').default;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:3001';

let failed = 0;

function pass(msg: string) {
  console.log(`[smoke-002] PASS ${msg}`);
}

function fail(msg: string) {
  console.error(`[smoke-002] FAIL ${msg}`);
  failed++;
}

function skip(msg: string) {
  console.warn(`[smoke-002] SKIP ${msg}`);
}

async function checkSchema() {
  const db = postgres(
    process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
  );
  const cols = await db<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_products'
  `;
  const names = new Set(cols.map((c) => c.column_name));
  for (const col of ['stores_with_stock', 'branches_with_demand', 'average_demand', 'item_status']) {
    if (!names.has(col)) fail(`missing column stock_products.${col}`);
    else pass(`column stock_products.${col}`);
  }
  if (names.has('branches_with_stock')) fail('legacy column branches_with_stock still present');
  else pass('legacy branches_with_stock removed');

  const checks = await db<{ conname: string }[]>`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'stock_products'::regclass AND contype = 'c'
  `;
  if (checks.some((c) => c.conname === 'stock_products_item_status_check')) {
    pass('item_status CHECK constraint');
  } else {
    fail('item_status CHECK constraint missing');
  }

  const statuses = await db<{ item_status: string; n: string }[]>`
    SELECT item_status, COUNT(*)::text AS n FROM stock_products GROUP BY item_status
  `;
  const allowed = new Set(['distribution', 'adequate', 'boost']);
  for (const row of statuses) {
    if (!allowed.has(row.item_status)) fail(`invalid item_status in DB: ${row.item_status}`);
  }
  if (statuses.length > 0) pass(`item_status values in DB (${statuses.map((s) => `${s.item_status}:${s.n}`).join(', ')})`);

  const sample = await db`
    SELECT product_name, stores_with_stock, branches_with_demand, item_status, idd
    FROM stock_products LIMIT 5
  `;
  if (sample.length === 0) skip('no stock_products rows (import smoke manual)');
  else pass(`sample rows (${sample.length})`);

  await db.end();
}

async function checkVitest() {
  const r = spawnSync('pnpm', ['--filter', '@prudens/domain-metrics', 'test'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status === 0) pass('domain-metrics Vitest');
  else fail('domain-metrics Vitest');
}

async function checkApiHealth() {
  try {
    const t0 = performance.now();
    const res = await fetch(`${API}/health`);
    const ms = performance.now() - t0;
    if (!res.ok) {
      fail(`/health status ${res.status}`);
      return;
    }
    pass(`/health ${ms.toFixed(0)}ms`);
  } catch {
    skip(`API not reachable at ${API} (start pnpm --filter @prudens/api dev)`);
  }
}

async function checkServiceLayer() {
  await import('../apps/api/src/lib/load-env.js');
  const { adminMetricsService } = await import(
    '../apps/api/src/services/admin-metrics-service.js'
  );
  const { adminCompanyService } = await import(
    '../apps/api/src/services/admin-company-service.js'
  );
  const { clientOverviewService } = await import(
    '../apps/api/src/services/client-overview-service.js'
  );
  const { clientProductsService } = await import(
    '../apps/api/src/services/client-products-service.js'
  );
  const metrics = await adminMetricsService.getMetrics();
  if (typeof metrics.totalCompanies === 'number') pass('admin metrics service');
  else fail('admin metrics shape');

  const companies = await adminCompanyService.listCards('demo');
  if (Array.isArray(companies)) pass(`admin companies search (${companies.length})`);
  else fail('admin companies list');

  const sql = postgres(
    process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
  );
  const clientRows = await sql<
    { id: string; clerk_user_id: string; email: string; company_id: string | null }[]
  >`SELECT id, clerk_user_id, email, company_id FROM users WHERE role = 'client' LIMIT 1`;
  await sql.end();
  const clientUser = clientRows[0];
  if (!clientUser?.company_id) {
    skip('no client user with company_id in DB');
    return;
  }

  const ctx = {
    userId: clientUser.id,
    clerkUserId: clientUser.clerk_user_id,
    email: clientUser.email,
    role: 'client' as const,
    companyId: clientUser.company_id,
  };

  const t0 = performance.now();
  const [overview, products] = await Promise.all([
    clientOverviewService.getOverview(ctx),
    clientProductsService.getProducts(ctx, { limit: 50, sort: 'idd', order: 'desc' }),
  ]);
  const ms = performance.now() - t0;

  if (overview.companyName) pass('client overview service');
  else if (overview.lastUpdatedAt == null) pass('client overview empty state');
  else fail('client overview');

  if (products.chart_data.length <= 500) pass(`chart_data cap (${products.chart_data.length})`);
  else fail(`chart_data exceeds 500 (${products.chart_data.length})`);

  if (ms <= 5000) pass(`overview+products services ${ms.toFixed(0)}ms (SC-005 proxy)`);
  else fail(`overview+products slow ${ms.toFixed(0)}ms > 5000ms`);

  const filtered = await clientProductsService.getProducts(ctx, {
    term: 'a',
    item_status: ['boost'],
    limit: 50,
  });
  if (filtered.items.every((p) => p.itemStatus === 'boost' || filtered.items.length === 0)) {
    pass('client products filter item_status=boost');
  } else fail('filter item_status returned non-boost rows');

  if (companies[0]) {
    const detail = await adminCompanyService.getDetail(companies[0].id);
    if (detail?.company.id) pass('admin company detail');
    else fail('admin company detail');
  }
}

async function checkAuthEnforced() {
  try {
    const res = await fetch(`${API}/api/client/overview`);
    if (res.status === 401) pass('client overview requires auth (401)');
    else fail(`expected 401 without token, got ${res.status}`);
  } catch {
    skip('auth check skipped (API down)');
  }
}

async function main() {
  console.log('[smoke-002] Starting quickstart smoke...\n');
  await checkSchema();
  await checkVitest();
  await checkServiceLayer();
  await checkApiHealth();
  await checkAuthEnforced();

  console.log('');
  if (failed > 0) {
    console.error(`[smoke-002] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('[smoke-002] All automated checks passed');
  console.log('[smoke-002] Manual: UI /admin, /dashboard, admin upload, tenant isolation (quickstart §7–8)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
