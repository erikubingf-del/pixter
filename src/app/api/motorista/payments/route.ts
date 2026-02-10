import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import stripe from '@/lib/stripe/server';
import { requireMotorista } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

const DEFAULT_RESPONSE = {
  balance: {
    available: [{ amount: 'R$ 0,00', currency: 'brl' }],
    pending: [{ amount: 'R$ 0,00', currency: 'brl' }],
  },
  transactions: [],
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  }).format(amount / 100);
}

async function getPaymentDetails(
  tx: Stripe.BalanceTransaction,
  stripeAccountId: string
): Promise<{ metodo: string | null; cliente: string | null; chargeId: string | null; receipt_url: string | null }> {
  let metodo: string | null = tx.type || 'payment';
  let cliente: string | null = 'N/A';
  let chargeId: string | null = null;
  let receipt_url: string | null = null;

  try {
    if (tx.source && typeof tx.source === 'string' && (tx.source.startsWith('ch_') || tx.source.startsWith('py_'))) {
      const charge = await stripe.charges.retrieve(
        tx.source,
        { expand: ['customer', 'invoice'] },
        { stripeAccount: stripeAccountId }
      );

      chargeId = charge.id;
      metodo = charge.payment_method_details?.type || 'Desconhecido';
      cliente = charge.billing_details?.email || charge.receipt_email || (charge.customer as Stripe.Customer)?.email || 'Não informado';
      receipt_url = charge.receipt_url;
    } else if (tx.source && typeof tx.source === 'object' && tx.source.object === 'charge') {
      const charge = tx.source as Stripe.Charge;
      chargeId = charge.id;
      metodo = charge.payment_method_details?.type || 'Desconhecido';
      cliente = charge.billing_details?.email || charge.receipt_email || 'Não informado';
      receipt_url = charge.receipt_url;
    }
  } catch (err) {
    console.error('Error fetching charge details:', (err as Error).message);
    metodo = tx.type || 'payment_error';
    cliente = 'Erro ao buscar detalhes';
  }

  return { metodo, cliente, chargeId, receipt_url };
}

export async function GET(request: Request) {
  try {
    const session = await requireMotorista();
    const userId = session.id;

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ...DEFAULT_RESPONSE, error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const stripeAccountId = profile.stripe_account_id;
    if (!stripeAccountId) {
      return NextResponse.json({
        ...DEFAULT_RESPONSE,
        needsConnection: true,
        message: 'Conta Stripe não configurada. Por favor, conecte sua conta Stripe.',
      });
    }

    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    const account = await stripe.accounts.retrieve(stripeAccountId);
    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });

    const listParams: Stripe.BalanceTransactionListParams = { limit: 100, expand: ['data.source'] };
    if (startDateParam || endDateParam) {
      const createdFilter: Stripe.RangeQueryParam = {};
      if (startDateParam) createdFilter.gte = Math.floor(new Date(startDateParam).getTime() / 1000);
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setDate(end.getDate() + 1);
        createdFilter.lt = Math.floor(end.getTime() / 1000);
      }
      listParams.created = createdFilter;
    }

    const completedTransactions = await stripe.balanceTransactions.list(listParams, { stripeAccount: stripeAccountId });

    // Fetch pending charges
    const pendingBalance = await stripe.balanceTransactions.list(
      { ...listParams, type: 'charge', available_on: { gt: Math.floor(Date.now() / 1000) } },
      { stripeAccount: stripeAccountId }
    );

    const pendingChargeIds = pendingBalance.data
      .map(tx => (typeof tx.source === 'string' ? tx.source : tx.source?.id))
      .filter((id): id is string => !!id && (id.startsWith('ch_') || id.startsWith('py_')));

    const pendingCharges = await Promise.all(
      pendingChargeIds.map(id =>
        stripe.charges.retrieve(id, { expand: ['balance_transaction', 'customer'] }, { stripeAccount: stripeAccountId })
      )
    );

    const formattedAvailable = balance.available.map(b => ({ amount: formatAmount(b.amount, b.currency), currency: b.currency.toUpperCase() }));
    const formattedPending = balance.pending.map(b => ({ amount: formatAmount(b.amount, b.currency), currency: b.currency.toUpperCase() }));

    const processedCompletedTxs = await Promise.all(
      completedTransactions.data.map(async tx => {
        const details = await getPaymentDetails(tx, stripeAccountId);
        return {
          id: tx.id,
          chargeId: details.chargeId,
          amount: formatAmount(tx.amount, tx.currency),
          currency: tx.currency.toUpperCase(),
          description: tx.description || '-',
          created: new Date(tx.created * 1000).toISOString(),
          type: tx.type,
          metodo: details.metodo,
          cliente: details.cliente,
          fee: tx.fee ? formatAmount(tx.fee, tx.currency) : 'R$ 0,00',
          status: 'completed',
          receipt_url: details.receipt_url,
        };
      })
    );

    const processedPendingTxs = pendingCharges.map(charge => ({
      id: charge.id,
      chargeId: charge.id,
      amount: formatAmount(charge.amount, charge.currency),
      currency: charge.currency.toUpperCase(),
      description: charge.description || 'Pagamento pendente',
      created: new Date(charge.created * 1000).toISOString(),
      type: 'charge',
      metodo: charge.payment_method_details?.type || 'Pagamento pendente',
      cliente: charge.billing_details?.email || charge.receipt_email || (charge.customer as Stripe.Customer)?.email || 'Não informado',
      fee: charge.application_fee_amount ? formatAmount(charge.application_fee_amount, charge.currency) : 'R$ 0,00',
      status: 'pending',
      receipt_url: charge.receipt_url,
    }));

    const allTransactions = [...processedCompletedTxs, ...processedPendingTxs].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );

    return NextResponse.json({
      balance: { available: formattedAvailable, pending: formattedPending },
      transactions: allTransactions,
      dateRange: { start: startDateParam, end: endDateParam },
      stripeAccountStatus: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return safeErrorResponse(error, 'Erro ao buscar pagamentos');
  }
}
