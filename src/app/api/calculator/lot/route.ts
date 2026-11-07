import { NextRequest, NextResponse } from 'next/server';
import { calculateLotSize } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = calculateLotSize(
      body.balance,
      body.risk_pct,
      body.stop_loss_pips,
      body.symbol
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to calculate lot' }, { status: 500 });
  }
}
