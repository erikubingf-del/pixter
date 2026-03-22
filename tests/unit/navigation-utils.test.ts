import { describe, expect, it } from 'vitest';

import {
  buildPathWithSearch,
  sanitizeInternalCallbackUrl,
} from '@/lib/utils/navigation';

describe('navigation utils', () => {
  it('builds a callback path with the existing search params', () => {
    const params = new URLSearchParams({ from: 'payment', phone: '5511999999999' });

    expect(buildPathWithSearch('/pagamento/5511999999999', params)).toBe(
      '/pagamento/5511999999999?from=payment&phone=5511999999999'
    );
  });

  it('rejects external callback urls', () => {
    expect(sanitizeInternalCallbackUrl('https://evil.test', '/cliente/dashboard')).toBe(
      '/cliente/dashboard'
    );
    expect(sanitizeInternalCallbackUrl('//evil.test', '/cliente/dashboard')).toBe(
      '/cliente/dashboard'
    );
  });

  it('keeps internal callback urls', () => {
    expect(
      sanitizeInternalCallbackUrl('/pagamento/5511999999999?source=login', '/cliente/dashboard')
    ).toBe('/pagamento/5511999999999?source=login');
  });
});
