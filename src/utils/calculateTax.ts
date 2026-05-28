export interface TaxCalculationInput {
  subtotal: number;
  taxRate: number;
  isInclusive: boolean;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  isInclusive: boolean;
}

export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const { subtotal, taxRate, isInclusive } = input;
  const rate = taxRate / 100;

  let taxAmount: number;
  let total: number;

  if (isInclusive) {
    total = subtotal;
    taxAmount = Number((subtotal - (subtotal / (1 + rate))).toFixed(2));
  } else {
    taxAmount = Number((subtotal * rate).toFixed(2));
    total = Number((subtotal + taxAmount).toFixed(2));
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount,
    total,
    taxRate,
    isInclusive,
  };
}

export function calculateInvoiceTotal(
  items: { price: number; quantity: number }[],
  taxRate: number,
  isTaxInclusive: boolean
): TaxCalculationResult {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  return calculateTax({ subtotal, taxRate, isInclusive: isTaxInclusive });
}
