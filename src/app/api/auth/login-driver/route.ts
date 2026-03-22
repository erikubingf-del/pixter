import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json(
    {
      error: 'Login por telefone está desativado neste MVP. Use email ou Google em /login.',
    },
    { status: 410 }
  );
}
