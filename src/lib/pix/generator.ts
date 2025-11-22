/**
 * Pix Static QR Code Generator (BR Code/EMV)
 * Based on Banco Central do Brasil specification
 * Generates "Copia e Cola" payload for Pix payments
 */

interface PixPayload {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: number // in BRL (e.g., 10.50)
  txid?: string // Transaction ID (optional, max 25 chars)
  description?: string // Payment description (optional)
}

// CRC16-CCITT calculation for EMV
function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

// Format TLV (Tag-Length-Value) field
function formatTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

/**
 * Generate Pix "Copia e Cola" payload
 * Returns the BR Code string that can be copied and used for payment
 */
export function generatePixPayload(payload: PixPayload): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txid,
    description
  } = payload

  // Clean and validate inputs
  const cleanPixKey = pixKey.trim()
  const cleanName = merchantName.trim().substring(0, 25) // Max 25 chars
  const cleanCity = merchantCity.trim().toUpperCase().substring(0, 15) // Max 15 chars
  const cleanTxid = txid?.trim().substring(0, 25) || '' // Max 25 chars
  const cleanDescription = description?.trim().substring(0, 72) || '' // Max 72 chars

  // Validate amount
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  // Format amount (must have 2 decimal places)
  const formattedAmount = amount.toFixed(2)

  // Build the payload following BR Code (EMV) specification
  let payload_str = ''

  // 00: Payload Format Indicator (fixed: "01")
  payload_str += formatTLV('00', '01')

  // 01: Point of Initiation Method (11 = static, 12 = dynamic)
  // Using 12 for dynamic (with amount)
  payload_str += formatTLV('01', '12')

  // 26: Merchant Account Information (Pix)
  let merchantAccount = ''
  merchantAccount += formatTLV('00', 'br.gov.bcb.pix') // GUI
  merchantAccount += formatTLV('01', cleanPixKey) // Pix key
  if (cleanDescription) {
    merchantAccount += formatTLV('02', cleanDescription) // Description
  }
  payload_str += formatTLV('26', merchantAccount)

  // 52: Merchant Category Code (0000 = not specified)
  payload_str += formatTLV('52', '0000')

  // 53: Transaction Currency (986 = BRL)
  payload_str += formatTLV('53', '986')

  // 54: Transaction Amount
  payload_str += formatTLV('54', formattedAmount)

  // 58: Country Code (BR = Brazil)
  payload_str += formatTLV('58', 'BR')

  // 59: Merchant Name
  payload_str += formatTLV('59', cleanName)

  // 60: Merchant City
  payload_str += formatTLV('60', cleanCity)

  // 62: Additional Data Field Template (optional)
  if (cleanTxid) {
    let additionalData = ''
    additionalData += formatTLV('05', cleanTxid) // Transaction ID
    payload_str += formatTLV('62', additionalData)
  }

  // 63: CRC16 (must be calculated last)
  // Add placeholder for CRC
  payload_str += '6304'

  // Calculate CRC16 and append
  const crcValue = crc16(payload_str)
  payload_str += crcValue

  return payload_str
}

/**
 * Validate Pix key format
 * Supports: CPF, CNPJ, Email, Phone, Random key
 */
export function validatePixKey(pixKey: string): boolean {
  const key = pixKey.trim()

  // Email format
  if (key.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(key)
  }

  // Phone format (with or without +55)
  if (key.startsWith('+')) {
    const phoneRegex = /^\+55\d{10,11}$/
    return phoneRegex.test(key)
  }

  // CPF (11 digits)
  if (key.length === 11 && /^\d{11}$/.test(key)) {
    return true
  }

  // CNPJ (14 digits)
  if (key.length === 14 && /^\d{14}$/.test(key)) {
    return true
  }

  // Random key (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(key)) {
    return true
  }

  // Phone without country code (10 or 11 digits)
  if ((key.length === 10 || key.length === 11) && /^\d+$/.test(key)) {
    return true
  }

  return false
}

/**
 * Format Pix key for display
 */
export function formatPixKeyDisplay(pixKey: string): string {
  const key = pixKey.trim()

  // CPF: XXX.XXX.XXX-XX
  if (key.length === 11 && /^\d{11}$/.test(key)) {
    return `${key.substring(0, 3)}.${key.substring(3, 6)}.${key.substring(6, 9)}-${key.substring(9)}`
  }

  // CNPJ: XX.XXX.XXX/XXXX-XX
  if (key.length === 14 && /^\d{14}$/.test(key)) {
    return `${key.substring(0, 2)}.${key.substring(2, 5)}.${key.substring(5, 8)}/${key.substring(8, 12)}-${key.substring(12)}`
  }

  // Phone: (XX) XXXXX-XXXX
  if (key.length === 11 && /^\d{11}$/.test(key)) {
    return `(${key.substring(0, 2)}) ${key.substring(2, 7)}-${key.substring(7)}`
  }

  // Phone: (XX) XXXX-XXXX
  if (key.length === 10 && /^\d{10}$/.test(key)) {
    return `(${key.substring(0, 2)}) ${key.substring(2, 6)}-${key.substring(6)}`
  }

  return key
}
