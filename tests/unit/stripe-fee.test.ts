import { describe, expect, it } from 'vitest';

import { calculateFee } from '@/lib/stripe/server';

describe('stripe fee pricing', () => {
  it('charges 3% plus R$0,39', () => {
    expect(calculateFee(250)).toBe(47);
    expect(calculateFee(10000)).toBe(339);
    expect(calculateFee(40000)).toBe(1239);
  });
});
