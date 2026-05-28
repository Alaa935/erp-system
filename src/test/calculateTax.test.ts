import { describe, it, expect } from 'vitest';
import { calculateTax, calculateInvoiceTotal } from '../utils/calculateTax';

describe('calculateTax', () => {
  it('calculates exclusive tax correctly', () => {
    const result = calculateTax({ subtotal: 100, taxRate: 14, isInclusive: false });
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(14);
    expect(result.total).toBe(114);
    expect(result.isInclusive).toBe(false);
  });

  it('calculates inclusive tax correctly', () => {
    const result = calculateTax({ subtotal: 114, taxRate: 14, isInclusive: true });
    expect(result.subtotal).toBe(114);
    expect(result.taxAmount).toBe(14);
    expect(result.total).toBe(114);
    expect(result.isInclusive).toBe(true);
  });

  it('returns zero tax for zero rate', () => {
    const result = calculateTax({ subtotal: 100, taxRate: 0, isInclusive: false });
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(100);
  });

  it('handles zero subtotal', () => {
    const result = calculateTax({ subtotal: 0, taxRate: 14, isInclusive: false });
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('rounds tax to 2 decimal places', () => {
    const result = calculateTax({ subtotal: 33.33, taxRate: 14, isInclusive: false });
    expect(result.taxAmount).toBe(4.67);
    expect(result.total).toBe(38);
  });
});

describe('calculateInvoiceTotal', () => {
  it('sums item prices and calculates tax', () => {
    const items = [
      { price: 50, quantity: 2 },
      { price: 30, quantity: 1 },
    ];
    const result = calculateInvoiceTotal(items, 14, false);
    expect(result.subtotal).toBe(130);
    expect(result.taxAmount).toBe(18.2);
    expect(result.total).toBe(148.2);
  });

  it('handles empty items', () => {
    const result = calculateInvoiceTotal([], 14, false);
    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});
