/**
 * SC-001 smoke: documents target ≤60s import→completed (requires running stack + fixture).
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const MAX_MS = 60_000;

async function main() {
  let health: Response;
  try {
    health = await fetch(`${API_URL}/health`);
  } catch {
    console.warn('[smoke-sla] API not reachable; skip (start docker + api + worker)');
    process.exit(0);
  }
  if (!health.ok) {
    console.warn('[smoke-sla] API not reachable; skip (start docker + api + worker)');
    process.exit(0);
  }
  console.log(`[smoke-sla] API ok. SLA target: import→completed ≤${MAX_MS}ms`);
  console.log('[smoke-sla] Run manual upload with fixtures/sample-stock-267-rows.xlsx and measure.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
