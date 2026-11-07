import { NextRequest, NextResponse } from 'next/server';
import { getAccountById, updateAccount, deleteAccount } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = getAccountById(id);
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateAccount(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const purgeTrades = searchParams.get('purge_trades') === 'true';

  const deleted = deleteAccount(id, purgeTrades);
  if (!deleted) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Account disconnected successfully' });
}
