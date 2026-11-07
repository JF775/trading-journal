import { NextRequest, NextResponse } from 'next/server';
import { getAccountById, updateAccount, deleteAccount } from '@/lib/db';
import { prisma, hasNeonDatabase } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (hasNeonDatabase()) {
    try {
      const neonAcc = await prisma.brokerAccount.findUnique({
        where: { id },
        include: {
          _count: {
            select: { trades: true }
          }
        }
      });
      if (neonAcc) {
        return NextResponse.json({
          ...neonAcc,
          trades_count: neonAcc._count?.trades || 0
        });
      }
    } catch (e) {
      console.warn('Neon get account error:', e);
    }
  }

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

    if (hasNeonDatabase()) {
      try {
        const updated = await prisma.brokerAccount.update({
          where: { id },
          data: {
            name: body.name !== undefined ? body.name : undefined,
            balance: body.balance !== undefined ? Number(body.balance) : undefined,
            equity: body.equity !== undefined ? Number(body.equity) : undefined,
            floating_pnl: body.floating_pnl !== undefined ? Number(body.floating_pnl) : undefined,
            status: body.status || undefined,
            leverage: body.leverage ? Number(body.leverage) : undefined
          }
        });
        updateAccount(id, body);
        return NextResponse.json(updated);
      } catch (e) {
        console.warn('Neon update account error:', e);
      }
    }

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

  if (hasNeonDatabase()) {
    try {
      if (purgeTrades) {
        await prisma.trade.deleteMany({ where: { account_id: id } });
      }
      await prisma.brokerAccount.delete({ where: { id } }).catch(() => null);
    } catch (e) {
      console.warn('Neon delete account error:', e);
    }
  }

  const deleted = deleteAccount(id, purgeTrades);
  return NextResponse.json({ success: true, message: 'Account disconnected successfully' });
}
