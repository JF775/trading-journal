/**
 * 1-Click Migration Script: Local JSON to Neon PostgreSQL
 * Usage: npx tsx scripts/migrate-json-to-neon.ts
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Load environment variables manually if not loaded
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
  console.error('\n❌ DATABASE_URL belum diatur di .env.local!');
  console.log('Silakan masukkan connection string Neon Anda ke .env.local:');
  console.log('DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/[dbname]?sslmode=require"\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('\n🚀 Memulai Migrasi Data JSON ke Neon PostgreSQL...');
  console.log(`📡 Menghubungkan ke: ${dbUrl?.split('@')[1]?.split('?')[0] || 'Neon PostgreSQL'}`);

  const dataDir = path.join(process.cwd(), 'data');

  // 1. Migrate Users
  const usersPath = path.join(dataDir, 'users.json');
  let userCount = 0;
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    console.log(`\n👤 Memproses ${users.length} pengguna...`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          avatar: u.avatar || null,
          provider: u.provider || 'credentials',
          password_hash: u.password_hash || null,
          role: u.role || 'client_starter',
          preferred_broker: u.preferred_broker || 'Exness',
          last_login: u.last_login ? new Date(u.last_login) : null
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
          created_at: u.created_at ? new Date(u.created_at) : new Date(),
          last_login: u.last_login ? new Date(u.last_login) : null
        }
      });
      userCount++;
    }
    console.log(`✅ ${userCount} pengguna berhasil dimigrasi!`);
  }

  // 2. Migrate Broker Accounts
  const accountsPath = path.join(dataDir, 'accounts.json');
  let accountCount = 0;
  if (fs.existsSync(accountsPath)) {
    const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
    console.log(`\n🏦 Memproses ${accounts.length} akun broker...`);
    for (const a of accounts) {
      // Find or assign valid user_id
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
          investor_password: a.investor_password || null,
          account_type: a.account_type || 'cent',
          currency: a.currency || 'USD',
          leverage: Number(a.leverage) || 500,
          balance: Number(a.balance) || 0,
          equity: Number(a.equity) || 0,
          floating_pnl: Number(a.floating_pnl) || 0,
          status: a.status || 'connected',
          sync_mode: a.sync_mode || 'local',
          sync_error: a.sync_error || null,
          last_sync: a.last_sync ? new Date(a.last_sync) : null,
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
          sync_error: a.sync_error || null,
          last_sync: a.last_sync ? new Date(a.last_sync) : null,
          created_at: a.created_at ? new Date(a.created_at) : new Date(),
          trades_count: Number(a.trades_count) || 0
        }
      });
      accountCount++;
    }
    console.log(`✅ ${accountCount} akun broker berhasil dimigrasi!`);
  }

  // 3. Migrate Trades
  const tradesPath = path.join(dataDir, 'trades.json');
  let tradeCount = 0;
  if (fs.existsSync(tradesPath)) {
    const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf-8'));
    console.log(`\n📈 Memproses ${trades.length} riwayat transaksi...`);

    // Ensure valid account_id exists in db
    const availableAccounts = await prisma.brokerAccount.findMany({ select: { id: true } });
    const accountIds = new Set(availableAccounts.map(acc => acc.id));

    for (const t of trades) {
      if (!accountIds.has(t.account_id)) {
        continue;
      }

      await prisma.trade.upsert({
        where: {
          account_id_ticket: {
            account_id: t.account_id,
            ticket: String(t.ticket || t.id)
          }
        },
        update: {
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
          session: t.session || null,
          notes: t.notes || null,
          rule_followed: Boolean(t.rule_followed ?? true),
          psychology_state: t.psychology_state || null,
          mistake_tag: t.mistake_tag || null,
          mae: t.mae != null ? Number(t.mae) : null,
          mfe: t.mfe != null ? Number(t.mfe) : null,
          screenshot_url: t.screenshot_url || null,
          is_reviewed: Boolean(t.is_reviewed),
          reviewed_at: t.reviewed_at ? new Date(t.reviewed_at) : null
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
          session: t.session || null,
          notes: t.notes || null,
          rule_followed: Boolean(t.rule_followed ?? true),
          psychology_state: t.psychology_state || null,
          mistake_tag: t.mistake_tag || null,
          mae: t.mae != null ? Number(t.mae) : null,
          mfe: t.mfe != null ? Number(t.mfe) : null,
          screenshot_url: t.screenshot_url || null,
          is_reviewed: Boolean(t.is_reviewed),
          reviewed_at: t.reviewed_at ? new Date(t.reviewed_at) : null
        }
      });
      tradeCount++;
    }
    console.log(`✅ ${tradeCount} transaksi berhasil dimigrasi ke Neon!`);
  }

  console.log('\n🎉 SELURUH DATA BERHASIL DIMIGRASI KE NEON POSTGRESQL!\n');
}

migrate()
  .catch((e) => {
    console.error('❌ Gagal melakukan migrasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
