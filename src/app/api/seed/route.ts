import { NextResponse } from 'next/server';
import { reseedDemoTrades } from '@/lib/db';

export async function POST() {
  const trades = reseedDemoTrades();
  return NextResponse.json({
    status: 'success',
    message: `Successfully re-seeded ${trades.length} realistic trades with PRO metrics.`
  });
}
