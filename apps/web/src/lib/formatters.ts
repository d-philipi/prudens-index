export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number },
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const decimals = options?.decimals ?? 2;
  return `${value.toFixed(decimals)}%`;
}
