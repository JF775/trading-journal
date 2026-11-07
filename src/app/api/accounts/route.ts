import { NextRequest, NextResponse } from 'next/server';
import { getAllAccounts, addAccount, initAccountsDB, initDB, findUserById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  initAccountsDB(true);
  initDB(true);
  const headerId = request.headers.get('x-user-id');
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('userId');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/jfzla_user_session=([^;]+)/);
  const cookieUserId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

  const targetId = headerId || queryId || cookieUserId;
  let user: any = null;

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
        user = dbUser;
        const neonAccounts = await prisma.brokerAccount.findMany({
          where: { user_id: dbUser.id }
        });
        if (neonAccounts && neonAccounts.length > 0) {
          return NextResponse.json(neonAccounts, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
          });
        }
      }
    } catch (e) {
      console.warn('Neon accounts GET lookup error:', e);
    }
  }

  if (!user) {
    user = getAuthenticatedUser(request);
    if (!user && targetId) {
      user = findUserById(targetId) || null;
    }
  }

  const accounts = getAllAccounts(user?.id);
  return NextResponse.json(accounts, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headerId = request.headers.get('x-user-id');
    const targetId = body.user_id || body.userId || headerId;
    let user: any = null;
    let authoritativeRole: UserRole = body.role || 'client_starter';

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
          user = dbUser;
          authoritativeRole = dbUser.role as UserRole;
        }
      } catch (e) {
        console.warn('Neon user check in accounts POST error:', e);
      }
    }

    if (!user) {
      user = getAuthenticatedUser(request);
      if (!user && targetId) {
        user = findUserById(targetId) || null;
      }
      if (user?.role) {
        authoritativeRole = user.role as UserRole;
      }
    }

    if (!body.login || !body.server) {
      return NextResponse.json(
        { error: 'Server broker dan nomor akun (Login) wajib diisi.' },
        { status: 400 }
      );
    }

    const userId = user?.id || targetId || 'default_user';
    const newAccount = addAccount(body, userId, authoritativeRole);

    if (hasNeonDatabase() && user?.id) {
      try {
        await prisma.brokerAccount.upsert({
          where: {
            login_server: {
              login: String(newAccount.login),
              server: String(newAccount.server)
            }
          },
          update: {
            name: newAccount.name,
            broker: newAccount.broker,
            balance: newAccount.balance,
            equity: newAccount.equity,
            floating_pnl: newAccount.floating_pnl,
            status: newAccount.status
          },
          create: {
            id: newAccount.id,
            user_id: user.id,
            name: newAccount.name,
            broker: newAccount.broker,
            server: newAccount.server,
            login: String(newAccount.login),
            investor_password: newAccount.investor_password || null,
            account_type: newAccount.account_type || 'cent',
            currency: newAccount.currency || 'USD',
            leverage: newAccount.leverage || 500,
            balance: newAccount.balance || 0,
            equity: newAccount.equity || 0,
            floating_pnl: newAccount.floating_pnl || 0,
            status: newAccount.status || 'connected',
            created_at: new Date()
          }
        });
      } catch (neonAccErr) {
        console.warn('Neon brokerAccount create error:', neonAccErr);
      }
    }

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    console.error('Error adding broker account:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan akun broker.' }, { status: 400 });
  }
}
