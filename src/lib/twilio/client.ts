import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Envia um SMS com código de verificação para o número de telefone fornecido.
 */
export async function sendVerificationSMS(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Número de telefone deve começar com + e incluir código do país');
    }

    const message = await client.messages.create({
      body: `Seu código de verificação AmoPagar é: ${code}`,
      from: twilioPhone,
      to: phoneNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error: unknown) {
    console.error('Erro ao enviar SMS');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar SMS.',
    };
  }
}

/**
 * Gera um código de verificação aleatório de 6 dígitos.
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formata um número de telefone para o formato internacional.
 */
export function formatPhoneNumber(phone: string, countryCode = '55'): string {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.startsWith(countryCode)) {
    return `+${cleanPhone}`;
  }

  return `+${countryCode}${cleanPhone}`;
}
