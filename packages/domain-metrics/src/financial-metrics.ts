export interface FinancialMetrics {
  projected_revenue: number;
  tied_up_capital: number;
  lost_revenue: number;
}

export function calculateFinancialMetrics(input: {
  stock: number;
  average_demand: number;
  unit_price: number;
}): FinancialMetrics {
  const { stock, average_demand, unit_price } = input;
  if (!unit_price || unit_price <= 0) {
    return { projected_revenue: 0, tied_up_capital: 0, lost_revenue: 0 };
  }
  const demand = average_demand ?? 0;
  const stk = stock ?? 0;
  return {
    projected_revenue: Math.round(Math.min(stk, demand) * unit_price),
    tied_up_capital: Math.round(Math.max(0, stk - demand) * unit_price),
    lost_revenue: Math.round(Math.max(0, demand - stk) * unit_price),
  };
}
