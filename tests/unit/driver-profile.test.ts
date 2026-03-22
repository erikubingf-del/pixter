import { describe, expect, it } from 'vitest';

import {
  hasDriverCapabilityFromProfile,
  isDriverOnboardingComplete,
  normalizeRequestedAccountType,
} from '@/lib/auth/driver-profile';

describe('driver profile helpers', () => {
  it('defaults unknown signup account types to cliente', () => {
    expect(normalizeRequestedAccountType(undefined)).toBe('cliente');
    expect(normalizeRequestedAccountType(null)).toBe('cliente');
    expect(normalizeRequestedAccountType('anything-else')).toBe('cliente');
  });

  it('keeps motorista signup requests', () => {
    expect(normalizeRequestedAccountType('motorista')).toBe('motorista');
  });

  it('treats incomplete driver onboarding as not ready', () => {
    expect(
      isDriverOnboardingComplete({
        tipo: 'motorista',
        onboarding_completed: false,
        nome: 'Erik',
        cpf: '12345678901',
        data_nascimento: '1990-01-01',
        celular: '+5511999999999',
        profissao: 'Motorista',
      })
    ).toBe(false);

    expect(
      isDriverOnboardingComplete({
        tipo: 'motorista',
        onboarding_completed: true,
        nome: 'Erik',
        cpf: '12345678901',
        data_nascimento: '1990-01-01',
        celular: null,
        profissao: 'Motorista',
      })
    ).toBe(false);
  });

  it('marks fully completed driver onboarding as ready', () => {
    expect(
      isDriverOnboardingComplete({
        tipo: 'motorista',
        onboarding_completed: true,
        nome: 'Erik',
        cpf: '12345678901',
        data_nascimento: '1990-01-01',
        celular: '+5511999999999',
        profissao: 'Motorista',
      })
    ).toBe(true);
  });

  it('allows driver capability before onboarding is complete when the account was created as motorista', () => {
    expect(
      hasDriverCapabilityFromProfile({
        tipo: 'motorista',
        onboarding_completed: false,
      })
    ).toBe(true);
  });
});
