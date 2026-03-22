import { describe, expect, it } from 'vitest';
import {
  brlToCents,
  formatCentsToBrl,
  getPublicPaymentPath,
  normalizePhoneForPaymentPath,
} from '@/lib/utils/payment';

function normalizeSpace(value: string) {
  return value.replace(/\u00a0/g, ' ');
}

describe('payment utils', () => {
  it('normalizes Brazilian phone numbers for public payment paths', () => {
    expect(normalizePhoneForPaymentPath('+55 (11) 99999-9999')).toBe('11999999999');
    expect(getPublicPaymentPath('(11) 99999-9999')).toBe('/pagamento/11999999999');
  });

  it('converts BRL values to cents from numbers and localized strings', () => {
    expect(brlToCents(12.34)).toBe(1234);
    expect(brlToCents('12,34')).toBe(1234);
    expect(brlToCents('1.234,56')).toBe(123456);
  });

  it('formats cents back to BRL for UI output', () => {
    expect(normalizeSpace(formatCentsToBrl(123456))).toBe('R$ 1.234,56');
  });
});
