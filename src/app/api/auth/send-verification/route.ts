import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export function POST() {
  return NextResponse.json(
    {
      error: 'Verificação por telefone está desativada neste MVP. Use email ou Google para criar sua conta.',
    },
    { status: 410 }
  );
}
