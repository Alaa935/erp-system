
/**
 * ZATCA (Saudi Arabia) E-Invoicing (Phase 1) TLV QR Code Generator
 * 
 * Tags:
 * 1. Seller Name
 * 2. Seller VAT Number
 * 3. Timestamp (ISO 8601)
 * 4. Invoice Total (with VAT)
 * 5. VAT Total
 */

export function generateZATCATLV(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: string,
  vatAmount: string
): string {
  const parts = [
    createTLV(1, sellerName),
    createTLV(2, vatNumber),
    createTLV(3, timestamp),
    createTLV(4, totalAmount),
    createTLV(5, vatAmount),
  ];

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of parts) {
    combined.set(p, offset);
    offset += p.length;
  }

  return btoa(String.fromCharCode(...combined));
}

function createTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valBuf = encoder.encode(value);
  const tlv = new Uint8Array(2 + valBuf.length);
  tlv[0] = tag;
  tlv[1] = valBuf.length;
  tlv.set(valBuf, 2);
  return tlv;
}
