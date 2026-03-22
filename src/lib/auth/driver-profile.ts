export type RequestedAccountType = 'cliente' | 'motorista';

type NullableString = string | null | undefined;

export type DriverProfileLike = {
  tipo?: NullableString;
  onboarding_completed?: boolean | null;
  nome?: NullableString;
  cpf?: NullableString;
  data_nascimento?: NullableString;
  celular?: NullableString;
  profissao?: NullableString;
  stripe_account_id?: NullableString;
};

function hasValue(value: NullableString) {
  return Boolean(value && value.trim().length > 0);
}

export function normalizeRequestedAccountType(
  value: string | null | undefined
): RequestedAccountType {
  return value === 'motorista' ? 'motorista' : 'cliente';
}

export function isDriverOnboardingComplete(profile: DriverProfileLike | null | undefined) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.onboarding_completed &&
      hasValue(profile.nome) &&
      hasValue(profile.cpf) &&
      hasValue(profile.data_nascimento) &&
      hasValue(profile.celular) &&
      hasValue(profile.profissao)
  );
}

export function hasDriverCapabilityFromProfile(profile: DriverProfileLike | null | undefined) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.tipo === 'motorista' ||
      profile.onboarding_completed ||
      hasValue(profile.stripe_account_id) ||
      hasValue(profile.cpf) ||
      hasValue(profile.profissao) ||
      hasValue(profile.data_nascimento)
  );
}
