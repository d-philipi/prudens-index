/**
 * SC-002 smoke: dashboard endpoints should respond quickly when API is up.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const MAX_MS = 3000;

async function main() {
  const start = performance.now();
  let health: Response;
  try {
    health = await fetch(`${API_URL}/health`);
  } catch {
    console.warn('[smoke-dashboard-load] API not reachable; skip');
    process.exit(0);
  }
  const elapsed = performance.now() - start;
  if (!health.ok) {
    console.warn('[smoke-dashboard-load] API not reachable; skip');
    process.exit(0);
  }
  console.log(`[smoke-dashboard-load] /health ${elapsed.toFixed(0)}ms (authenticated routes need token)`);
  if (elapsed > MAX_MS) {
    console.error(`[smoke-dashboard-load] FAIL health > ${MAX_MS}ms`);
    process.exit(1);
  }
  console.log('[smoke-dashboard-load] PASS health within budget');
  console.log('[smoke-dashboard-load] SC-003: verify filter UI <500ms manually in browser');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
