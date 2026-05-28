import { describe, expect, it } from 'vitest';
import { computeItemStatusFromIdd } from './idd-item-status.js';

describe('computeItemStatusFromIdd', () => {
  it('returns distribution when IDD < 0', () => {
    expect(computeItemStatusFromIdd(-1)).toBe('distribution');
  });

  it('returns adequate when 0 <= IDD <= 20', () => {
    expect(computeItemStatusFromIdd(0)).toBe('adequate');
    expect(computeItemStatusFromIdd(20)).toBe('adequate');
  });

  it('returns boost when IDD > 20', () => {
    expect(computeItemStatusFromIdd(21)).toBe('boost');
  });

  it('throws when IDD is null or NaN', () => {
    expect(() => computeItemStatusFromIdd(null)).toThrow('IDD_REQUIRED');
    expect(() => computeItemStatusFromIdd(undefined)).toThrow('IDD_REQUIRED');
    expect(() => computeItemStatusFromIdd(Number.NaN)).toThrow('IDD_REQUIRED');
  });
});
