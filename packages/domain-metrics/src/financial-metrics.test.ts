import { describe, expect, it } from 'vitest';
import { calculateFinancialMetrics } from './financial-metrics.js';

describe('calculateFinancialMetrics', () => {
  it.each([
    { stock: 100, average_demand: 80, unit_price: 10, projected: 800, tied: 200, lost: 0 },
    { stock: 50, average_demand: 120, unit_price: 5, projected: 250, tied: 0, lost: 350 },
    { stock: 30, average_demand: 30, unit_price: 7.5, projected: 225, tied: 0, lost: 0 },
    { stock: 0, average_demand: 100, unit_price: 20, projected: 0, tied: 0, lost: 2000 },
    { stock: 100, average_demand: 0, unit_price: 15, projected: 0, tied: 1500, lost: 0 },
    { stock: 10, average_demand: 5, unit_price: 0, projected: 0, tied: 0, lost: 0 },
    { stock: 999999, average_demand: 500000, unit_price: 100, projected: 50000000, tied: 49999900, lost: 0 },
  ])(
    'stock=$stock demand=$average_demand price=$unit_price',
    ({ stock, average_demand, unit_price, projected, tied, lost }) => {
      const r = calculateFinancialMetrics({ stock, average_demand, unit_price });
      expect(r.projected_revenue).toBe(projected);
      expect(r.tied_up_capital).toBe(tied);
      expect(r.lost_revenue).toBe(lost);
    },
  );
});
