/**
 * CPF Validation Utilities
 * Brazilian individual taxpayer registry identification (Cadastro de Pessoas Físicas)
 */

/**
 * Removes all non-numeric characters from CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formats CPF to XXX.XXX.XXX-XX pattern
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);

  if (cleaned.length !== 11) {
    return cpf; // Return original if not 11 digits
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Validates CPF according to Brazilian rules
 * Returns true if valid, false otherwise
 *
 * Algorithm:
 * 1. CPF must have exactly 11 digits
 * 2. Cannot be all the same digit (e.g., 111.111.111-11)
 * 3. Must pass the check digit validation
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);

  // Must have exactly 11 digits
  if (cleaned.length !== 11) {
    return false;
  }

  // Cannot be all the same digit
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;

  if (checkDigit1 !== parseInt(cleaned.charAt(9))) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;

  if (checkDigit2 !== parseInt(cleaned.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Returns a validation error message if CPF is invalid
 * Returns null if valid
 */
export function getCPFValidationError(cpf: string): string | null {
  const cleaned = cleanCPF(cpf);

  if (!cpf || cleaned.length === 0) {
    return 'CPF é obrigatório';
  }

  if (cleaned.length !== 11) {
    return 'CPF deve ter 11 dígitos';
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return 'CPF inválido';
  }

  if (!validateCPF(cpf)) {
    return 'CPF inválido';
  }

  return null;
}

/**
 * Generates a random valid CPF (for testing purposes only)
 * WARNING: Do not use for production data!
 */
export function generateRandomCPF(): string {
  const randomDigits = (): string => {
    const digits: number[] = [];
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    return digits.join('');
  };

  const calculateCheckDigit = (base: string, multiplier: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base.charAt(i)) * multiplier--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = randomDigits();
  const digit1 = calculateCheckDigit(base, 10);
  const digit2 = calculateCheckDigit(base + digit1, 11);

  return formatCPF(base + digit1 + digit2);
}
