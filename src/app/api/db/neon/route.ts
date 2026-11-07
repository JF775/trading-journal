import { NextRequest, NextResponse } from 'next/server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = hasNeonDatabase();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      status: 'unconfigured',
      message: 'DATABASE_URL belum diatur di .env.local. Masukkan connection string Neon PostgreSQL Anda.'
    });
  }

  try {
    // Quick test query to Neon
    const [userCount, accountCount, tradeCount] = await Promise.all([
      prisma.user.count(),
      prisma.brokerAccount.count(),
      prisma.trade.count()
    ]);

    return NextResponse.json({
      configured: true,
      status: 'connected',
      engine: 'PostgreSQL (Neon Serverless)',
      stats: {
        users: userCount,
        accounts: accountCount,
        trades: tradeCount
      },
      message: 'Berhasil terhubung ke Neon Serverless PostgreSQL!'
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      status: 'error',
      error: err.message || 'Gagal terhubung ke Neon PostgreSQL.',
      hint: 'Pastikan skema database sudah di-push dengan menjalankan: npm run db:push'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!hasNeonDatabase()) {
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL belum diatur di .env.local.'
    }, { status: 400 });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');

    // 1. Users
    let migratedUsers = 0;
    const usersPath = path.join(dataDir, 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      for (const u of users) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            avatar: u.avatar || null,
            role: u.role || 'client_starter',
            preferred_broker: u.preferred_broker || 'Exness'
          },
          create: {
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar || null,
            provider: u.provider || 'credentials',
            password_hash: u.password_hash || null,
            role: u.role || 'client_starter',
            preferred_broker: u.preferred_broker || 'Exness',
            created_at: u.created_at ? new Date(u.created_at) : new Date()
          }
        });
        migratedUsers++;
      }
    }

    // 2. Broker Accounts
    let migratedAccounts = 0;
    const accountsPath = path.join(dataDir, 'accounts.json');
    if (fs.existsSync(accountsPath)) {
      const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
      for (const a of accounts) {
        let validUserId = a.user_id;
        if (!validUserId) {
          const firstUser = await prisma.user.findFirst();
          validUserId = firstUser?.id;
        }
        if (!validUserId) continue;

        await prisma.brokerAccount.upsert({
          where: {
            login_server: {
              login: String(a.login),
              server: a.server
            }
          },
          update: {
            name: a.name,
            broker: a.broker,
            balance: Number(a.balance) || 0,
            equity: Number(a.equity) || 0,
            floating_pnl: Number(a.floating_pnl) || 0,
            status: a.status || 'connected',
            sync_mode: a.sync_mode || 'local',
            trades_count: Number(a.trades_count) || 0
          },
          create: {
            id: a.id,
            user_id: validUserId,
            name: a.name,
            broker: a.broker,
            server: a.server,
            login: String(a.login),
            investor_password: a.investor_password || null,
            account_type: a.account_type || 'cent',
            currency: a.currency || 'USD',
            leverage: Number(a.leverage) || 500,
            balance: Number(a.balance) || 0,
            equity: Number(a.equity) || 0,
            floating_pnl: Number(a.floating_pnl) || 0,
            status: a.status || 'connected',
            sync_mode: a.sync_mode || 'local',
            trades_count: Number(a.trades_count) || 0
          }
        });
        migratedAccounts++;
      }
    }

    // 3. Trades
    let migratedTrades = 0;
    const tradesPath = path.join(dataDir, 'trades.json');
    if (fs.existsSync(tradesPath)) {
      const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf-8'));
      const availableAccounts = await prisma.brokerAccount.findMany({ select: { id: true } });
      const accountIds = new Set(availableAccounts.map((acc: { id: string }) => acc.id));

      for (const t of trades) {
        if (!accountIds.has(t.account_id)) continue;

        await prisma.trade.upsert({
          where: {
            account_id_ticket: {
              account_id: t.account_id,
              ticket: String(t.ticket || t.id)
            }
          },
          update: {
            profit: Number(t.profit) || 0,
            close_price: Number(t.close_price) || 0,
            is_reviewed: Boolean(t.is_reviewed),
            notes: t.notes || null
          },
          create: {
            id: String(t.id),
            ticket: String(t.ticket || t.id),
            account_id: t.account_id,
            user_id: t.user_id || null,
            symbol: t.symbol,
            order_type: t.order_type,
            lots: Number(t.lots) || 0.01,
            open_price: Number(t.open_price) || 0,
            close_price: Number(t.close_price) || 0,
            open_time: t.open_time ? new Date(t.open_time) : null,
            close_time: new Date(t.close_time || Date.now()),
            profit: Number(t.profit) || 0,
            commission: Number(t.commission) || 0,
            swap: Number(t.swap) || 0,
            strategy: t.strategy || 'Manual',
            notes: t.notes || null,
            rule_followed: Boolean(t.rule_followed ?? true),
            is_reviewed: Boolean(t.is_reviewed)
          }
        });
        migratedTrades++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrasi data dari JSON ke Neon PostgreSQL berhasil dilakukan!',
      migrated: {
        users: migratedUsers,
        accounts: migratedAccounts,
        trades: migratedTrades
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Gagal migrasi data ke Neon.'
    }, { status: 500 });
  }
}
