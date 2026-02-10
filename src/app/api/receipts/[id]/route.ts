import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import stripe from "@/lib/stripe/server";
import { supabaseServer } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/get-session";
import { escapeHtml } from "@/lib/utils/html-escape";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

const PIXTER_FEE_PERCENTAGE = 0.04;
const COMPANY_NAME = "Pixter";
const COMPANY_SUBTITLE = "Pagamentos Digitais Ltda.";
const FOOTER_TEXT = "Obrigado por usar Pixter. Volte sempre!";

function formatCurrency(value: number, currency: string = "brl"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency, currencyDisplay: "symbol" }).format(value / 100);
}

function formatDateHeader(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeFooter(): string {
  return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getPaymentMethodDetails(charge: any): string {
  if (!charge?.payment_method_details) return "Desconhecido";
  const details = charge.payment_method_details;
  switch (details.type) {
    case "card": return `Cartão ${details.card?.brand} final ${details.card?.last4}`;
    case "pix": return "Pix";
    case "boleto": return "Boleto";
    default: return details.type;
  }
}

function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "Não informado";
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return "Inválido";
  return `${cleaned.substring(0, 3)}.***.***-${cleaned.substring(9, 11)}`;
}

function getClientReceiptHtml(details: any): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Comprovante de Pagamento</title>
<style>body{font-family:Helvetica,Arial,sans-serif;margin:40px;color:#333;font-size:11pt}.container{max-width:600px;margin:auto;padding:30px}.header{text-align:left;margin-bottom:15px}.header h1{font-size:1.8em;margin:0;font-weight:bold;color:#000}.header p{font-size:.9em;margin:2px 0 0;color:#555}hr{border:none;border-top:1px solid #000;margin:15px 0}h2{font-size:1.2em;font-weight:bold;margin-bottom:20px;color:#000}.item{margin-bottom:12px;display:flex}.item span:first-child{font-weight:bold;color:#000;width:120px;display:inline-block}.item span:last-child{color:#333}.footer{text-align:center;margin-top:50px;font-size:.8em;color:#777}</style>
</head><body><div class="container">
<div class="header"><h1>${escapeHtml(COMPANY_NAME)}</h1><p>${escapeHtml(COMPANY_SUBTITLE)}</p></div><hr>
<h2>COMPROVANTE DE PAGAMENTO</h2>
<div class="item"><span>Data:</span><span>${escapeHtml(details.date_header)}</span></div>
<div class="item"><span>Nome Completo:</span><span>${escapeHtml(details.driver_name)}</span></div>
<div class="item"><span>CPF:</span><span>${escapeHtml(details.driver_cpf_masked)}</span></div>
<div class="item"><span>Profissão:</span><span>${escapeHtml(details.driver_profession)}</span></div>
<div class="item"><span>Valor Pago:</span><span>${escapeHtml(details.amount_paid_formatted)}</span></div>
<div class="item"><span>Link Pagamento:</span><span>${escapeHtml(details.payment_link)}</span></div>
<div class="footer">${escapeHtml(FOOTER_TEXT)}</div>
<div class="footer">ID: ${escapeHtml(details.transaction_id)} | Gerado em: ${escapeHtml(formatDateTimeFooter())}</div>
</div></body></html>`;
}

function getDriverReceiptHtml(details: any): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Detalhes do Recebimento</title>
<style>body{font-family:Helvetica,Arial,sans-serif;margin:40px;color:#333;font-size:11pt}.container{max-width:600px;margin:auto;padding:30px}.header{text-align:left;margin-bottom:15px}.header h1{font-size:1.8em;margin:0;font-weight:bold;color:#000}.header p{font-size:.9em;margin:2px 0 0;color:#555}hr{border:none;border-top:1px solid #000;margin:15px 0}h2{font-size:1.2em;font-weight:bold;margin-bottom:20px;color:#000}.item{margin-bottom:12px;display:flex}.item span:first-child{font-weight:bold;color:#000;width:160px;display:inline-block}.item span:last-child{color:#333}.fee{color:#e53e3e}.net{font-weight:bold}.footer{text-align:center;margin-top:50px;font-size:.8em;color:#777}</style>
</head><body><div class="container">
<div class="header"><h1>${escapeHtml(COMPANY_NAME)}</h1><p>${escapeHtml(COMPANY_SUBTITLE)}</p></div><hr>
<h2>DETALHES DO RECEBIMENTO</h2>
<div class="item"><span>Data:</span><span>${escapeHtml(details.date_header)}</span></div>
<div class="item"><span>Cliente:</span><span>${escapeHtml(details.client_identifier)}</span></div>
<div class="item"><span>Método:</span><span>${escapeHtml(details.method)}</span></div><hr>
<div class="item"><span>Valor Bruto Recebido:</span><span>${escapeHtml(details.amount_original_formatted)}</span></div>
<div class="item fee"><span>Taxa Pixter (${escapeHtml(details.fee_percentage)}%):</span><span>- ${escapeHtml(details.pixter_fee_formatted)}</span></div><hr>
<div class="item net"><span>Valor Líquido Recebido:</span><span>${escapeHtml(details.net_amount_formatted)}</span></div>
<div class="footer">${escapeHtml(FOOTER_TEXT)}</div>
<div class="footer">ID: ${escapeHtml(details.transaction_id)} | Gerado em: ${escapeHtml(formatDateTimeFooter())}</div>
</div></body></html>`;
}

type DriverProfile = {
  nome: string | null;
  profissao: string | null;
  celular: string | null;
  stripe_account_id: string | null;
  cpf: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "client";

    let chargeId: string | undefined;

    if (id.startsWith('REC-') || id.startsWith('AMO-') || id.startsWith('PIX-')) {
      const { data: payment, error: fetchError } = await supabaseServer
        .from('pagamentos')
        .select('stripe_charge_id, receipt_number, motorista_id, cliente_id')
        .eq('receipt_number', id)
        .single();

      if (fetchError || !payment || !payment.stripe_charge_id) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }

      // Verify ownership
      if (payment.motorista_id !== session.id && payment.cliente_id !== session.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      chargeId = payment.stripe_charge_id;
    } else {
      chargeId = id;
    }

    const charge = await stripe.charges.retrieve(chargeId!, {
      expand: ["customer", "payment_intent", "transfer", "balance_transaction"],
    });

    if (!charge) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 });
    }

    let stripeAccountId: string | null = null;
    if (charge.transfer_data?.destination) {
      stripeAccountId = charge.transfer_data.destination as string;
    } else if (charge.on_behalf_of) {
      stripeAccountId = charge.on_behalf_of as string;
    }

    let driverProfile: DriverProfile | null = null;
    if (type === "driver") {
      const { data: profile } = await supabaseServer
        .from("profiles")
        .select("stripe_account_id, nome, profissao, celular, cpf")
        .eq("id", session.id)
        .single();

      if (!profile) {
        return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
      }

      if (stripeAccountId && stripeAccountId !== profile.stripe_account_id) {
        return NextResponse.json({ error: "Recibo não pertence a esta conta." }, { status: 403 });
      }
      driverProfile = profile;
      if (!stripeAccountId) stripeAccountId = profile.stripe_account_id;
    } else if (stripeAccountId) {
      const { data: profile } = await supabaseServer
        .from("profiles")
        .select("nome, profissao, celular, cpf")
        .eq("stripe_account_id", stripeAccountId)
        .single();
      if (profile) driverProfile = { ...profile, stripe_account_id: stripeAccountId };
    }

    const driverName = driverProfile?.nome || "Motorista Pixter";
    const driverProfession = driverProfile?.profissao || "Profissional";
    const driverPhone = driverProfile?.celular?.replace(/\D/g, '') || null;
    const driverCpfMasked = maskCpf(driverProfile?.cpf);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "pixter.com";
    const paymentLink = driverPhone ? `${appUrl}/${driverPhone}` : "Link Indisponível";

    const originalAmount = charge.amount;
    const pixterFee = Math.round(originalAmount * PIXTER_FEE_PERCENTAGE);
    const netAmount = originalAmount - pixterFee;
    const clientIdentifier = charge.billing_details?.email || charge.billing_details?.name || "Cliente Anônimo";

    const receiptDetails = {
      transaction_id: charge.id,
      date_header: formatDateHeader(charge.created),
      driver_name: driverName,
      driver_profession: driverProfession,
      driver_cpf_masked: driverCpfMasked,
      client_identifier: clientIdentifier,
      method: getPaymentMethodDetails(charge),
      amount_paid_formatted: formatCurrency(originalAmount, charge.currency),
      amount_original_formatted: formatCurrency(originalAmount, charge.currency),
      pixter_fee_formatted: formatCurrency(pixterFee, charge.currency),
      fee_percentage: (PIXTER_FEE_PERCENTAGE * 100).toFixed(0),
      net_amount_formatted: formatCurrency(netAmount, charge.currency),
      payment_link: paymentLink,
    };

    const htmlContent = type === "driver" ? getDriverReceiptHtml(receiptDetails) : getClientReceiptHtml(receiptDetails);

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recibo_${chargeId}.pdf"`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao gerar recibo PDF");
  }
}
