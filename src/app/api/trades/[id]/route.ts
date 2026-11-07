import { NextRequest, NextResponse } from 'next/server';
import { getTradeById, deleteTrade } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trade = getTradeById(Number(id));
  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }
  return NextResponse.json(trade);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteTrade(Number(id));
  if (!success) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }
  return NextResponse.json({ status: 'success', message: `Trade ${id} deleted` });
}
