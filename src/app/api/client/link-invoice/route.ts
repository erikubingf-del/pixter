import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic';


/**
 * Link Invoice by Receipt Number
 *
 * Allows authenticated users to manually add a receipt to their account
 * Used when user paid as guest and has the receipt number from screenshot
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado - faça login para continuar' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { receiptNumber } = await request.json()

    if (!receiptNumber || typeof receiptNumber !== 'string') {
      return NextResponse.json(
        { error: 'Número do recibo não fornecido' },
        { status: 400 }
      )
    }

    // Clean and validate receipt number
    const cleanedReceiptNumber = receiptNumber.trim()

    if (!cleanedReceiptNumber) {
      return NextResponse.json(
        { error: 'Número do recibo inválido' },
        { status: 400 }
      )
    }

    // Use Supabase server client
    const supabase = supabaseServer

    // Find payment by receipt number
    const { data: payment, error: fetchError } = await supabase
      .from('pagamentos')
      .select(`
        id,
        cliente_id,
        motorista_id,
        valor,
        created_at,
        receipt_number,
        motorista:profiles!motorista_id (nome)
      `)
      .eq('receipt_number', cleanedReceiptNumber)
      .single()

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError)
      return NextResponse.json(
        {
          error: 'Comprovante não encontrado',
          details: 'Verifique se digitou o número corretamente. O número diferencia maiúsculas de minúsculas.'
        },
        { status: 404 }
      )
    }

    // Check if payment is already linked to another user
    if (payment.cliente_id && payment.cliente_id !== userId) {
      return NextResponse.json(
        {
          error: 'Comprovante já vinculado a outra conta',
          details: 'Este comprovante já foi adicionado a outra conta. Se você acredita que isso é um erro, entre em contato com o suporte.'
        },
        { status: 409 }
      )
    }

    // Check if payment is already linked to this user
    if (payment.cliente_id === userId) {
      return NextResponse.json(
        {
          error: 'Comprovante já adicionado',
          details: 'Este comprovante já está na sua conta. Verifique seu histórico de pagamentos.'
        },
        { status: 409 }
      )
    }

    // Check if user is trying to link their own payment as driver
    if (payment.motorista_id === userId) {
      return NextResponse.json(
        {
          error: 'Não é possível adicionar este comprovante',
          details: 'Você é o vendedor deste pagamento. Vendedores não podem adicionar seus próprios pagamentos como clientes.'
        },
        { status: 400 }
      )
    }

    // Link payment to user
    const { error: updateError } = await supabase
      .from('pagamentos')
      .update({
        cliente_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Error linking payment:', updateError)
      return NextResponse.json(
        {
          error: 'Erro ao vincular comprovante',
          details: 'Ocorreu um erro ao adicionar o comprovante. Tente novamente.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Comprovante vinculado com sucesso',
      payment: {
        id: payment.id,
        valor: payment.valor,
        created_at: payment.created_at,
        receipt_number: payment.receipt_number,
        motorista: payment.motorista
      }
    })

  } catch (error: any) {
    console.error('Error in link-invoice:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error.message || 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      },
      { status: 500 }
    )
  }
}
