import { describe, expect, it } from 'vitest';
import { calculateItemStatus } from './calculate-item-status.js';

const base = {
  average_demand: 100,
  tied_up_capital: 5000,
};

describe('calculateItemStatus', () => {
  it('stock_days 0 → critical_rupture regardless of idd', () => {
    expect(calculateItemStatus({ stock_days: 0, idd: 99, ...base }).item_status).toBe(
      'critical_rupture',
    );
  });

  it('stock_days 7 → low_stock regardless of idd', () => {
    expect(calculateItemStatus({ stock_days: 7, idd: -10, ...base }).item_status).toBe(
      'low_stock',
    );
  });

  it('stock_days 100 → stuck_stock regardless of idd', () => {
    expect(calculateItemStatus({ stock_days: 100, idd: 0, ...base }).item_status).toBe(
      'stuck_stock',
    );
  });

  it('stock_days 60 → slight_excess regardless of idd', () => {
    expect(calculateItemStatus({ stock_days: 60, idd: 50, ...base }).item_status).toBe(
      'slight_excess',
    );
  });

  it('stock_days 30, idd -5 → unbalanced', () => {
    expect(calculateItemStatus({ stock_days: 30, idd: -5, ...base }).item_status).toBe(
      'unbalanced',
    );
  });

  it('stock_days 30, idd 10 → healthy', () => {
    expect(calculateItemStatus({ stock_days: 30, idd: 10, ...base }).item_status).toBe(
      'healthy',
    );
  });

  it('stock_days 30, idd 25 → concentrated', () => {
    expect(calculateItemStatus({ stock_days: 30, idd: 25, ...base }).item_status).toBe(
      'concentrated',
    );
  });

  it('boundary: stock_days 14 → low_stock; 15 → healthy at idd 10', () => {
    expect(calculateItemStatus({ stock_days: 14, idd: 10, ...base }).item_status).toBe(
      'low_stock',
    );
    expect(calculateItemStatus({ stock_days: 15, idd: 10, ...base }).item_status).toBe(
      'healthy',
    );
  });

  it('boundary: stock_days 90 → slight_excess; 91 → stuck_stock', () => {
    expect(calculateItemStatus({ stock_days: 90, idd: 10, ...base }).item_status).toBe(
      'slight_excess',
    );
    expect(calculateItemStatus({ stock_days: 91, idd: 10, ...base }).item_status).toBe(
      'stuck_stock',
    );
  });

  it('stock_days null/negative normalizes to critical_rupture', () => {
    expect(
      calculateItemStatus({ stock_days: Number.NaN, idd: 10, ...base }).item_status,
    ).toBe('critical_rupture');
    expect(calculateItemStatus({ stock_days: -3, idd: 10, ...base }).item_status).toBe(
      'critical_rupture',
    );
  });

  it('idd null/NaN in band 15-44 → unbalanced', () => {
    expect(
      calculateItemStatus({ stock_days: 30, idd: Number.NaN, ...base }).item_status,
    ).toBe('unbalanced');
  });

  it('includes action_insight with interpolated values', () => {
    const r = calculateItemStatus({ stock_days: 0, idd: 5, ...base });
    expect(r.action_insight).toContain('Ruptura Crítica');
    expect(r.action_insight).toContain('unidades/mês');
  });

  it('stuck_stock insight uses formatCurrency without duplicate R$', () => {
    const r = calculateItemStatus({ stock_days: 100, idd: 5, ...base });
    expect(r.action_insight).toMatch(/Capital parado estimado em R\$\s*5\.000/);
    expect(r.action_insight).not.toMatch(/R\$\s*R\$|R\$\s*R\$/);
  });
});
