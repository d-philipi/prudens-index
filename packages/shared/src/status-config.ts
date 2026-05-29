import type { ItemStatus } from './types/index.js';

export const STATUS_DISPLAY_ORDER = [
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated',
] as const satisfies readonly ItemStatus[];

export const STATUS_CONFIG: Record<
  ItemStatus,
  {
    label: string;
    color: string;
    actionLabel: string;
    pulseAnimation: boolean;
  }
> = {
  critical_rupture: {
    label: 'Ruptura Crítica',
    color: '#dc2626',
    actionLabel: 'Reabastecer Urgente',
    pulseAnimation: true,
  },
  low_stock: {
    label: 'Estoque Baixo',
    color: '#ea580c',
    actionLabel: 'Reabastecer',
    pulseAnimation: false,
  },
  unbalanced: {
    label: 'Desbalanceado',
    color: '#2563eb',
    actionLabel: 'Distribuir para lojas com demanda',
    pulseAnimation: false,
  },
  stuck_stock: {
    label: 'Estoque Encalhado',
    color: '#7c3aed',
    actionLabel: 'Impulsionar Vendas',
    pulseAnimation: false,
  },
  slight_excess: {
    label: 'Excesso Leve',
    color: '#6b7280',
    actionLabel: 'Não Reabastecer',
    pulseAnimation: false,
  },
  healthy: {
    label: 'Saudável',
    color: '#16a34a',
    actionLabel: 'Manter como está',
    pulseAnimation: false,
  },
  concentrated: {
    label: 'Concentrado',
    color: '#d97706',
    actionLabel: 'Avaliar Demanda Local',
    pulseAnimation: false,
  },
};
