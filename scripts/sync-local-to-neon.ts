import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      process.env.DATABASE_URL = trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
}

async function runLocalSync() {
  const { prisma } = await import('../src/lib/prisma');
  try {
    console.log('========================================================');
    console.log('      JFZLA CentTrade - MT5 Live Cloud Synchronizer      ');
    console.log('========================================================\n');

    const accounts = await prisma.brokerAccount.findMany({
      where: {
        investor_password: { not: null },
        login: { notIn: ['20993412', '8839120', '1000101', '1100234'] }
      }
    });

    if (accounts.length === 0) {
      console.log('Tidak ada akun MT5 dengan password investor terdaftar di database.');
      return;
    }

    const bridgeScript = path.join(__dirname, 'mt5-bridge.py');

    for (const acc of accounts) {
      console.log(`[>>] Memeriksa Akun #${acc.login} (${acc.server})...`);
      try {
        const out = execFileSync('python', [
          bridgeScript,
          '--login', String(acc.login),
          '--password', String(acc.investor_password),
          '--server', String(acc.server),
          '--days', '60'
        ], { encoding: 'utf8', timeout: 30000 });

        const res = JSON.parse(out);
        if (!res.success) {
          console.error(`  [!] Gagal sinkronisasi #${acc.login}: ${res.error}`);
          continue;
        }

        const mt5Acc = res.account;
        const deals = res.deals || [];

        // 1. Update account in Neon DB
        await prisma.brokerAccount.update({
          where: { id: acc.id },
          data: {
            balance: mt5Acc.balance,
            equity: mt5Acc.equity,
            floating_pnl: mt5Acc.floating_pnl,
            currency: mt5Acc.currency || acc.currency,
            leverage: mt5Acc.leverage || acc.leverage,
            status: 'connected',
            sync_mode: 'local',
            last_sync: new Date()
          }
        });

        console.log(`  [OK] Tersambung ke broker: Saldo ${mt5Acc.balance} ${mt5Acc.currency}, Equity ${mt5Acc.equity}`);

        // 2. Sync deals into Neon DB
        let newTrades = 0;
        for (const d of deals) {
          await prisma.trade.upsert({
            where: {
              account_id_ticket: {
                account_id: acc.id,
                ticket: d.ticket
              }
            },
            update: {
              profit: d.profit,
              close_price: d.close_price,
              close_time: new Date(d.close_time)
            },
            create: {
              ticket: d.ticket,
              account_id: acc.id,
              user_id: acc.user_id,
              symbol: d.symbol,
              order_type: d.order_type,
              lots: d.lots,
              open_price: d.open_price,
              close_price: d.close_price,
              open_time: d.open_time ? new Date(d.open_time) : null,
              close_time: new Date(d.close_time),
              profit: d.profit,
              commission: d.commission,
              swap: d.swap,
              strategy: d.strategy || acc.name,
              session: d.session || 'New York',
              notes: d.notes,
              rule_followed: true,
              psychology_state: 'Disciplined',
              mistake_tag: 'None'
            }
          });
          newTrades++;
        }

        console.log(`  [OK] Berhasil memperbarui ${newTrades} transaksi riwayat ke database cloud.\n`);
      } catch (err: any) {
        console.error(`  [!] Error eksekusi bridge untuk akun #${acc.login}:`, err.message);
      }
    }

    console.log('========================================================');
    console.log('   Semua akun berhasil disinkronkan ke Web Journal!     ');
    console.log('   Kunjungi: https://trading-journal-jfzla.vercel.app   ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Fatal sync error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runLocalSync();
