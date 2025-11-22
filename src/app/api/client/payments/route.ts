// src/app/api/client/payments/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Payment {
  id: string;
  created_at: string;
  valor: number;
  metodo: string | null;
  receipt_number: string;
  receipt_pdf_url: string | null;
  receipt_url: string | null;
  status: string;
  motorista: { nome: string } | { nome: string }[] | null;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<any>({ cookies: () => cookieStore });

  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Erro interno ao verificar sessão' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('pagamentos')
      .select(`
        id,
        created_at,
        valor,
        metodo,
        receipt_number,
        receipt_pdf_url,
        receipt_url,
        status,
        motorista:profiles!motorista_id (
          nome
        )
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateObj.toISOString());
    }

    // Execute query
    const { data: payments, error } = await query;

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico de pagamentos' },
        { status: 500 }
      );
    }

    // Normalize the data - convert array to single object if needed
    const normalizedPayments = (payments || []).map((payment: any) => ({
      ...payment,
      motorista: Array.isArray(payment.motorista)
        ? payment.motorista[0] || null
        : payment.motorista
    })) as Payment[];

    // Apply search filter (client-side)
    let filteredPayments = normalizedPayments;

    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(p => {
        const motoristaNome = Array.isArray(p.motorista)
          ? p.motorista[0]?.nome
          : p.motorista?.nome;
        return motoristaNome?.toLowerCase().includes(searchLower);
      });
    }

    return NextResponse.json({
      payments: filteredPayments,
      total: filteredPayments.length,
    });

  } catch (error: any) {
    console.error('Erro geral ao buscar pagamentos:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
