import { NextRequest, NextResponse } from 'next/server';
import { getAllTrades, addTrade, initDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || undefined;
  const order_type = searchParams.get('order_type') || undefined;
  const strategy = searchParams.get('strategy') || undefined;
  const date = searchParams.get('date') || undefined;
  const account_id = searchParams.get('account_id') || undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 500;

  const headerId = request.headers.get('x-user-id');
  const queryId = searchParams.get('userId');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/jfzla_user_session=([^;]+)/);
  const cookieUserId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
  const targetId = headerId || queryId || cookieUserId;

  let user = getAuthenticatedUser(request);

  if (hasNeonDatabase() && targetId) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: targetId },
            { email: targetId.includes('@') ? targetId.toLowerCase().trim() : undefined }
          ]
        }
      });

      if (dbUser) {
        user = dbUser as any;
        const userAccounts = await prisma.brokerAccount.findMany({
          where: dbUser.role === 'admin' ? undefined : { user_id: dbUser.id },
          select: { id: true }
        });
        const accountIds = userAccounts.map(a => a.id);

        if (account_id && !accountIds.includes(account_id) && dbUser.role !== 'admin') {
          return NextResponse.json([], {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
          });
        }

        const whereClause: any = {};
        if (account_id) {
          whereClause.account_id = account_id;
        } else if (dbUser.role !== 'admin') {
          whereClause.account_id = { in: accountIds };
        }

        if (symbol) whereClause.symbol = symbol.toUpperCase();
        if (order_type) whereClause.order_type = order_type.toUpperCase();
        if (strategy) whereClause.strategy = strategy;

        const neonTrades = await prisma.trade.findMany({
          where: whereClause,
          orderBy: { close_time: 'desc' },
          take: limit
        });

        if (neonTrades && neonTrades.length > 0) {
          return NextResponse.json(
            neonTrades.map(t => ({
              ...t,
              close_time: t.close_time.toISOString(),
              open_time: t.open_time ? t.open_time.toISOString() : undefined,
              reviewed_at: t.reviewed_at ? t.reviewed_at.toISOString() : undefined
            })),
            { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
          );
        }
      }
    } catch (e) {
      console.warn('Neon trades GET query error:', e);
    }
  }

  initDB(false);
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
