const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const stockDaysFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return brlFormatter.format(value);
}

export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number },
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const decimals = options?.decimals ?? 2;
  return `${value.toFixed(decimals)}%`;
}

export function formatStockDays(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return stockDaysFormatter.format(value);
}

export function formatAverageDemand(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return String(Math.round(value));
}
