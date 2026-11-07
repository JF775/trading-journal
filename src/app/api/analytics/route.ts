import { NextRequest, NextResponse } from 'next/server';
import { calculateAnalytics, initDB, initAccountsDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';
import { Trade } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account_id = searchParams.get('account_id') || undefined;
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

        if (account_id && account_id !== 'all' && !accountIds.includes(account_id) && dbUser.role !== 'admin') {
          return NextResponse.json(calculateAnalytics(undefined, undefined, []), {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
          });
        }

        const whereClause: any = {};
        if (account_id && account_id !== 'all') {
          whereClause.account_id = account_id;
        } else if (dbUser.role !== 'admin') {
          whereClause.account_id = { in: accountIds };
        }

        const neonTrades = await prisma.trade.findMany({
          where: whereClause,
          orderBy: { close_time: 'asc' }
        });

        if (neonTrades && neonTrades.length > 0) {
          const mappedTrades: Trade[] = neonTrades.map((t, idx) => ({
            id: idx + 1,
            ticket: t.ticket,
            account_id: t.account_id,
            user_id: t.user_id || undefined,
            symbol: t.symbol,
            order_type: t.order_type as 'BUY' | 'SELL',
            lots: t.lots,
            open_price: t.open_price,
            close_price: t.close_price,
            open_time: t.open_time ? t.open_time.toISOString() : undefined,
            close_time: t.close_time.toISOString(),
            profit: t.profit,
            commission: t.commission,
            swap: t.swap,
            strategy: t.strategy,
            session: t.session || 'London',
            notes: t.notes || '',
            rule_followed: t.rule_followed,
            psychology_state: t.psychology_state || 'Disciplined',
            mistake_tag: t.mistake_tag || 'None',
            mae: t.mae || undefined,
            mfe: t.mfe || undefined,
            screenshot_url: t.screenshot_url || undefined,
            is_reviewed: t.is_reviewed,
            reviewed_at: t.reviewed_at ? t.reviewed_at.toISOString() : undefined
          }));

          const analytics = calculateAnalytics(account_id, user?.id, mappedTrades);
          return NextResponse.json(analytics, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
          });
        }
      }
    } catch (e) {
      console.warn('Neon analytics calculation error:', e);
    }
  }

  initAccountsDB(false);
  initDB(false);
  const analytics = calculateAnalytics(account_id, user?.id);
  return NextResponse.json(analytics, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}
