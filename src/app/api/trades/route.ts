import { NextRequest, NextResponse } from 'next/server';
import { getAllTrades, addTrade, initDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || undefined;
  const order_type = searchParams.get('order_type') || undefined;
  const strategy = searchParams.get('strategy') || undefined;
  const date = searchParams.get('date') || undefined;
  const account_id = searchParams.get('account_id') || undefined;

  const user = getAuthenticatedUser(request);

  initDB(true);
  const trades = getAllTrades({ symbol, order_type, strategy, date, account_id, userId: user?.id });
  return NextResponse.json(trades, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const body = await request.json();
    const trade = addTrade(body, user?.id);
    return NextResponse.json(trade, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record trade' }, { status: 400 });
  }
}
