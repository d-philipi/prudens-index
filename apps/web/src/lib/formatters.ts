export {
  formatAverageDemand,
  formatCurrency,
  formatPercent,
  formatStockDays,
} from '@prudens/shared/formatters';

const unitPriceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUnitPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return unitPriceFormatter.format(value);
}
