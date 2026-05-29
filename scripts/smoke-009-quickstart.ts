/**
 * Automated checks for specs/009-stock-status-matrix/quickstart.md
 * Run: pnpm tsx scripts/smoke-009-quickstart.ts (repo root)
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../apps/api/package.json'));
const postgres = require('postgres') as typeof import('postgres').default;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWED_STATUSES = new Set([
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated',
]);

const LEGACY_STATUSES = new Set(['distribution', 'adequate', 'boost']);

let failed = 0;

function pass(msg: string) {
  console.log(`[smoke-009] PASS ${msg}`);
}

function fail(msg: string) {
  console.error(`[smoke-009] FAIL ${msg}`);
  failed++;
}

async function checkSchema() {
  const db = postgres(
    process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
  );

  const enumRows = await db<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status_v2') AS exists
  `;
  if (enumRows[0]?.exists) pass('enum item_status_v2 exists');
  else fail('enum item_status_v2 missing — run apps/api db:migrate');

  const cols = await db<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_products'
  `;
  const names = new Set(cols.map((c) => c.column_name));
  if (names.has('action_insight')) pass('column action_insight');
  else fail('column action_insight missing');

  const statuses = await db<{ item_status: string }[]>`
    SELECT DISTINCT item_status::text AS item_status FROM stock_products
  `;
  for (const row of statuses) {
    if (LEGACY_STATUSES.has(row.item_status)) {
      fail(`legacy item_status in DB: ${row.item_status}`);
    }
    if (!ALLOWED_STATUSES.has(row.item_status)) {
      fail(`unknown item_status in DB: ${row.item_status}`);
    }
  }
  if (statuses.length > 0) {
    pass(`item_status values (${statuses.map((s) => s.item_status).join(', ')})`);
  }

  await db.end();
}

function checkVitest() {
  const r = spawnSync('pnpm', ['--filter', '@prudens/domain-metrics', 'test'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status === 0) pass('domain-metrics Vitest (calculateItemStatus)');
  else fail('domain-metrics Vitest failed');
}

async function main() {
  await checkSchema();
  checkVitest();
  if (failed > 0) {
    console.error(`[smoke-009] ${failed} failure(s)`);
    process.exit(1);
  }
  console.log('[smoke-009] All checks passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
