const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const unitPriceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return brlFormatter.format(value);
}

export function formatUnitPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return unitPriceFormatter.format(value);
}

export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number },
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const decimals = options?.decimals ?? 2;
  return `${value.toFixed(decimals)}%`;
}
