import { NextResponse } from 'next/server';
import { getRuntimeHealthReport } from '@/lib/health/runtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = await getRuntimeHealthReport();
  const statusCode = report.status === 'error' ? 503 : 200;

  return NextResponse.json(report, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
