export const SHEET_COLUMN_MAPPING = {
  PRODUTO: { field: 'product_name', type: 'string' as const },
  EAN: { field: 'ean', type: 'string' as const },
  'Lojas com estoque': { field: 'stores_with_stock', type: 'int' as const },
  distribuição: { field: 'distribution', type: 'float' as const },
  'Lojas com demanda nos últ 3 meses': { field: 'branches_with_demand', type: 'int' as const },
  'Demanda x Distribuição': { field: 'demand_vs_distribution', type: 'float' as const },
  IDD: { field: 'idd', type: 'float' as const },
  estoque: { field: 'stock', type: 'int' as const },
  'demanda media': { field: 'average_demand', type: 'float' as const },
  'dias estoque': { field: 'stock_days', type: 'float' as const },
  'Valor Unitário': { field: 'unit_price', type: 'float' as const },
} as const;

export type SheetColumnHeader = keyof typeof SHEET_COLUMN_MAPPING;
