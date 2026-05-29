import { describe, expect, it } from 'vitest';
import { calculateItemStatus } from './calculate-item-status.js';

const base = {
  stock: 100,
  average_demand: 100,
  tied_up_capital: 5000,
};

describe('calculateItemStatus', () => {
  it('stock_days 0 → critical_rupture regardless of idd', () => {
    expect(
      calculateItemStatus({ stock_days: 0, idd: 99, ...base }).item_status,
    ).toBe('critical_rupture');
  });

  it('stock_days 7 → low_stock regardless of idd', () => {
    expect(
      calculateItemStatus({ stock_days: 7, idd: -10, ...base }).item_status,
    ).toBe('low_stock');
  });

  it('stock_days 100 → stuck_stock regardless of idd', () => {
    expect(
      calculateItemStatus({ stock_days: 100, idd: 0, ...base }).item_status,
    ).toBe('stuck_stock');
  });

  it('stock_days 60 → slight_excess regardless of idd', () => {
    expect(
      calculateItemStatus({ stock_days: 60, idd: 50, ...base }).item_status,
    ).toBe('slight_excess');
  });

  it('stock_days 30, idd -5 → unbalanced', () => {
    expect(
      calculateItemStatus({ stock_days: 30, idd: -5, ...base }).item_status,
    ).toBe('unbalanced');
  });

  it('stock_days 30, idd 10 → low_stock (piso 30 dias para saudável)', () => {
    expect(
      calculateItemStatus({ stock_days: 30, idd: 10, ...base }).item_status,
    ).toBe('low_stock');
  });

  it('stock_days 31, idd 10 → healthy', () => {
    expect(
      calculateItemStatus({ stock_days: 31, idd: 10, ...base }).item_status,
    ).toBe('healthy');
  });

  it('stock_days 30, idd 25 → concentrated', () => {
    expect(
      calculateItemStatus({ stock_days: 30, idd: 25, ...base }).item_status,
    ).toBe('concentrated');
  });

  it('boundary: stock_days 14 → low_stock; 15 with idd 10 → low_stock', () => {
    expect(
      calculateItemStatus({ stock_days: 14, idd: 10, ...base }).item_status,
    ).toBe('low_stock');
    expect(
      calculateItemStatus({ stock_days: 15, idd: 10, ...base }).item_status,
    ).toBe('low_stock');
  });

  it('boundary: stock_days 90 → slight_excess; 91 → stuck_stock', () => {
    expect(
      calculateItemStatus({ stock_days: 90, idd: 10, ...base }).item_status,
    ).toBe('slight_excess');
    expect(
      calculateItemStatus({ stock_days: 91, idd: 10, ...base }).item_status,
    ).toBe('stuck_stock');
  });

  it('stock_days null with stock>0 and demand 0 → stuck_stock (passo 0)', () => {
    expect(
      calculateItemStatus({
        stock_days: null,
        idd: 10,
        stock: 50,
        average_demand: 0,
        tied_up_capital: 5000,
      }).item_status,
    ).toBe('stuck_stock');
  });

  it('stock_days Infinity with stock>0 and demand 0 → stuck_stock', () => {
    expect(
      calculateItemStatus({
        stock_days: Number.POSITIVE_INFINITY,
        idd: 10,
        stock: 50,
        average_demand: 0,
        tied_up_capital: 5000,
      }).item_status,
    ).toBe('stuck_stock');
  });

  it('stock_days null/negative without passo 0 → critical_rupture', () => {
    expect(
      calculateItemStatus({ stock_days: Number.NaN, idd: 10, ...base }).item_status,
    ).toBe('critical_rupture');
    expect(
      calculateItemStatus({ stock_days: -3, idd: 10, ...base }).item_status,
    ).toBe('critical_rupture');
  });

  it('idd null/NaN in band 15-44 → unbalanced', () => {
    expect(
      calculateItemStatus({ stock_days: 30, idd: Number.NaN, ...base }).item_status,
    ).toBe('unbalanced');
  });

  it('low_stock oportunidade (25 dias) não menciona duas semanas', () => {
    const r = calculateItemStatus({ stock_days: 25, idd: 10, ...base });
    expect(r.item_status).toBe('low_stock');
    expect(r.action_insight).not.toContain('duas semanas');
    expect(r.action_insight).toContain('perda de oportunidade');
  });

  it('stuck_stock passo 0 menciona demanda zero', () => {
    const r = calculateItemStatus({
      stock_days: null,
      idd: 5,
      stock: 100,
      average_demand: 0,
      tied_up_capital: 5000,
    });
    expect(r.item_status).toBe('stuck_stock');
    expect(r.action_insight).toContain('demanda média é de 0');
    expect(r.action_insight).toContain('impulsionar vendas');
  });

  it('stuck_stock insight uses formatCurrency without duplicate R$', () => {
    const r = calculateItemStatus({ stock_days: 100, idd: 5, ...base });
    expect(r.action_insight).toMatch(/Capital parado estimado em R\$\s*5\.000/);
    expect(r.action_insight).not.toMatch(/R\$\s*R\$/);
  });
});
