import {
  formatAverageDemand,
  formatCurrency,
  formatPercent,
  formatStockDays,
} from '@prudens/shared/formatters';
import type { ItemStatus } from '@prudens/shared/types';

export interface CalculateItemStatusInput {
  stock_days: number;
  idd: number;
  average_demand: number;
  tied_up_capital: number;
}

export interface CalculateItemStatusResult {
  item_status: ItemStatus;
  action_insight: string;
}

function normalizeStockDays(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function resolveItemStatus(stockDays: number, idd: number): ItemStatus {
  const days = normalizeStockDays(stockDays);

  if (days === 0) return 'critical_rupture';
  if (days > 0 && days < 15) return 'low_stock';
  if (days > 90) return 'stuck_stock';
  if (days >= 45 && days <= 90) return 'slight_excess';

  const iddValue = Number.isFinite(idd) ? idd : Number.NaN;
  if (!Number.isFinite(iddValue) || iddValue < 0) return 'unbalanced';
  if (iddValue <= 20) return 'healthy';
  return 'concentrated';
}

function buildActionInsight(
  status: ItemStatus,
  vars: CalculateItemStatusInput,
): string {
  const stockDays = normalizeStockDays(vars.stock_days);
  const stockDaysText = formatStockDays(stockDays);
  const avgText = formatAverageDemand(vars.average_demand);
  const iddText = formatPercent(vars.idd, { decimals: 0 });
  const capitalText = formatCurrency(vars.tied_up_capital);

  switch (status) {
    case 'critical_rupture':
      return `Ruptura Crítica: este produto tem ${stockDaysText} dias de estoque — sem unidades disponíveis na rede. A demanda média é de ${avgText} unidades/mês. Ação necessária: reabastecimento urgente.`;
    case 'low_stock':
      return `Estoque Baixo: este produto tem apenas ${stockDaysText} dias de estoque restante com demanda média de ${avgText} unidades/mês. O estoque da rede não dura duas semanas. Ação: acionar compras antes de avaliar distribuição.`;
    case 'unbalanced':
      return `Desbalanceado: volume total adequado (${stockDaysText} dias de estoque), mas distribuição ineficiente — IDD de ${iddText}. O produto está concentrado nas filiais erradas em relação à demanda. Ação: transferir unidades para as lojas com maior demanda.`;
    case 'stuck_stock':
      return `Estoque Encalhado: ${stockDaysText} dias de estoque parado na rede com demanda média de ${avgText} unidades/mês. Mais de 3 meses de estoque imobilizado. Capital parado estimado em ${capitalText}. Ação: promoções ou queima de estoque.`;
    case 'slight_excess':
      return `Excesso Leve: ${stockDaysText} dias de estoque, acima do ideal de 45 dias. A demanda média é de ${avgText} unidades/mês. O volume atende o mês atual e avança para o próximo ciclo. Ação: suspender novas compras deste item até o volume baixar.`;
    case 'healthy':
      return `Saudável: volume ideal de ${stockDaysText} dias de estoque com IDD de ${iddText} — distribuição equilibrada entre as filiais com demanda. Demanda média de ${avgText} unidades/mês. Nenhuma ação necessária.`;
    case 'concentrated':
      return `Concentrado: ${stockDaysText} dias de estoque com IDD de ${iddText} — início de acúmulo desproporcional em poucas praças. Volume total ainda dentro do período seguro. Demanda média de ${avgText} unidades/mês. Ação: avaliar distribuição regional antes do próximo ciclo de compra.`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function calculateItemStatus(
  input: CalculateItemStatusInput,
): CalculateItemStatusResult {
  const item_status = resolveItemStatus(input.stock_days, input.idd);
  const action_insight = buildActionInsight(item_status, input);
  return { item_status, action_insight };
}
