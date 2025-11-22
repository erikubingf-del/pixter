/**
 * Receipt HTML Template for PDF Generation
 * Based on receipt.png design, adapted for Pixter
 */

export interface ReceiptData {
  // Receipt Info
  receiptNumber: string;
  date: Date;

  // Vendor Info
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorEmail?: string;

  // Payer Info
  payerName: string | null;  // NULL for guest payments

  // Payment Details
  amount: number;  // In BRL
  currency: string;
  paymentMethod: string;  // 'card', 'pix', 'apple_pay'
  cardLast4?: string;  // For card payments

  // Optional
  authCode?: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const formattedDate = data.date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  const formattedTime = data.date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.amount);

  // Determine payment method display
  let paymentMethodDisplay = '';
  if (data.paymentMethod === 'card' && data.cardLast4) {
    paymentMethodDisplay = `Cartão de Crédito (final ${data.cardLast4})`;
  } else if (data.paymentMethod === 'pix') {
    paymentMethodDisplay = 'Pix';
  } else if (data.paymentMethod === 'apple_pay') {
    paymentMethodDisplay = 'Apple Pay';
  } else if (data.paymentMethod === 'google_pay') {
    paymentMethodDisplay = 'Google Pay';
  } else {
    paymentMethodDisplay = 'Cartão de Crédito';
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo #${data.receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: white;
      padding: 40px;
      color: #1a1a1a;
    }

    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
    }

    .vendor-info {
      flex: 1;
    }

    .vendor-name {
      font-size: 28px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }

    .vendor-tagline {
      font-size: 14px;
      color: #718096;
      font-style: italic;
      margin-bottom: 20px;
    }

    .vendor-details {
      font-size: 13px;
      line-height: 1.8;
      color: #4a5568;
    }

    .vendor-details strong {
      color: #2d3748;
    }

    .receipt-label {
      text-align: right;
      color: #a0aec0;
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 2px;
    }

    .receipt-meta {
      text-align: right;
      margin-top: 15px;
    }

    .receipt-meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .receipt-meta-label {
      font-weight: 600;
      color: #2d3748;
    }

    .receipt-meta-value {
      color: #4a5568;
    }

    .payer-section {
      margin-bottom: 40px;
    }

    .payer-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #718096;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .payer-name {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }

    .payment-table {
      width: 100%;
      margin-bottom: 40px;
    }

    .payment-table-header {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 2px solid #2d3748;
      margin-bottom: 15px;
    }

    .payment-table-header-cell {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #718096;
      text-transform: uppercase;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .payment-description {
      font-size: 15px;
      color: #2d3748;
    }

    .payment-amount {
      font-size: 15px;
      color: #2d3748;
      font-weight: 500;
    }

    .total-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #2d3748;
    }

    .total-row {
      display: flex;
      justify-content: flex-end;
      gap: 60px;
      margin-bottom: 8px;
    }

    .total-label {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      letter-spacing: -0.3px;
    }

    .total-amount {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
    }

    .payment-confirmation {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 20px;
      margin-top: 40px;
      text-align: center;
    }

    .confirmation-title {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 8px;
      letter-spacing: 0.3px;
    }

    .confirmation-details {
      font-size: 13px;
      color: #4a5568;
      line-height: 1.6;
    }

    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 13px;
      color: #718096;
      font-style: italic;
    }

    .page-number {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #a0aec0;
    }

    @media print {
      body {
        padding: 0;
      }
      .receipt {
        border: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="vendor-info">
        <div class="vendor-name">${data.vendorName}</div>
        <div class="vendor-tagline">Pagamento via Pixter</div>
        <div class="vendor-details">
          ${data.vendorAddress ? `<div><strong>Endereço:</strong><br>${data.vendorAddress}</div>` : ''}
          ${data.vendorPhone ? `<div style="margin-top: 8px;"><strong>Telefone:</strong> ${data.vendorPhone}</div>` : ''}
          ${data.vendorEmail ? `<div><strong>Email:</strong> ${data.vendorEmail}</div>` : ''}
        </div>
      </div>

      <div>
        <div class="receipt-label">RECIBO</div>
        <div class="receipt-meta">
          <div class="receipt-meta-row">
            <div class="receipt-meta-label">Recibo #:</div>
            <div class="receipt-meta-value">${data.receiptNumber}</div>
          </div>
          <div class="receipt-meta-row">
            <div class="receipt-meta-label">Data:</div>
            <div class="receipt-meta-value">${formattedDate}</div>
          </div>
          <div class="receipt-meta-row">
            <div class="receipt-meta-label">Hora:</div>
            <div class="receipt-meta-value">${formattedTime}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payer Info -->
    <div class="payer-section">
      <div class="payer-label">Pagador:</div>
      <div class="payer-name">${data.payerName || 'Cliente'}</div>
    </div>

    <!-- Payment Table -->
    <div class="payment-table">
      <div class="payment-table-header">
        <div class="payment-table-header-cell">Descrição</div>
        <div class="payment-table-header-cell">Valor</div>
      </div>

      <div class="payment-row">
        <div class="payment-description">Pagamento</div>
        <div class="payment-amount">${formattedAmount}</div>
      </div>

      <!-- Total -->
      <div class="total-section">
        <div class="total-row">
          <div class="total-label">TOTAL PAGO:</div>
          <div class="total-amount">${formattedAmount}</div>
        </div>
      </div>
    </div>

    <!-- Payment Confirmation -->
    <div class="payment-confirmation">
      <div class="confirmation-title">PAGAMENTO CONFIRMADO</div>
      <div class="confirmation-details">
        Pago via ${paymentMethodDisplay}
        ${data.authCode ? `<br>Código de Autorização: ${data.authCode}` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Obrigado pelo seu pagamento!
    </div>

    <div class="page-number">1</div>
  </div>
</body>
</html>
  `.trim();
}
