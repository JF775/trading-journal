import path from 'path';
import fs from 'fs';

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

const REAL_DEALS = [
  {
    ticket: "4418678696",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.2,
    open_price: 4072.948,
    close_price: 4072.4,
    open_time: new Date("2026-11-06T16:45:05Z"),
    close_time: new Date("2026-11-06T19:23:40Z"),
    profit: 11.0,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  },
  {
    ticket: "4419099667",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.2,
    open_price: 4070.608,
    close_price: 4045.242,
    open_time: new Date("2026-11-06T18:30:06Z"),
    close_time: new Date("2026-11-06T20:30:26Z"),
    profit: 507.4,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  },
  {
    ticket: "4418648111",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.2,
    open_price: 4074.09,
    close_price: 4045.242,
    open_time: new Date("2026-11-06T16:38:27Z"),
    close_time: new Date("2026-11-06T20:30:26Z"),
    profit: 577.0,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  },
  {
    ticket: "4419260625",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.2,
    open_price: 4067.545,
    close_price: 4045.242,
    open_time: new Date("2026-11-06T19:08:10Z"),
    close_time: new Date("2026-11-06T20:30:26Z"),
    profit: 446.1,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  },
  {
    ticket: "4419721783",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.1,
    open_price: 4059.042,
    close_price: 4045.242,
    open_time: new Date("2026-11-06T20:25:30Z"),
    close_time: new Date("2026-11-06T20:30:26Z"),
    profit: 138.0,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  },
  {
    ticket: "4419686514",
    symbol: "XAUUSDc",
    order_type: "SELL",
    lots: 0.3,
    open_price: 4064.432,
    close_price: 4045.242,
    open_time: new Date("2026-11-06T20:22:18Z"),
    close_time: new Date("2026-11-06T20:30:26Z"),
    profit: 575.7,
    commission: 0.0,
    swap: 0.0,
    strategy: "Road To 10000 Cent",
    session: "New York",
    notes: "Real deal synced from Exness-MT5Real25 #183766634"
  }
];

async function syncUserAccount() {
  const { prisma } = await import('../src/lib/prisma');
  try {
    console.log('1. Ensuring PARAMORE user exists in Neon DB...');
    const user = await prisma.user.upsert({
      where: { email: 'jonatagaming46@gmail.com' },
      update: {
        id: 'usr_google_paramore',
        name: 'PARAMORE',
        role: 'client_pro',
        preferred_broker: 'Exness'
      },
      create: {
        id: 'usr_google_paramore',
        name: 'PARAMORE',
        email: 'jonatagaming46@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PARAMORE',
        provider: 'google',
        role: 'client_pro',
        preferred_broker: 'Exness'
      }
    });

    console.log('2. Ensuring active PRO license exists in Neon DB...');
    await prisma.userLicense.upsert({
      where: { user_id: user.id },
      update: {
        package_type: 'pro',
        license_key: 'PTRACK-PRO-2026-VIP',
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 86400000)
      },
      create: {
        user_id: user.id,
        package_type: 'pro',
        license_key: 'PTRACK-PRO-2026-VIP',
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 86400000)
      }
    });

    const accountId = 'acc_exness_183766634';
    console.log('3. Upserting broker account 183766634 in Neon DB...');
    const acc = await prisma.brokerAccount.upsert({
      where: {
        login_server: {
          login: '183766634',
          server: 'Exness-MT5Real25'
        }
      },
      update: {
        user_id: user.id,
        name: 'Road To 10000 Cent',
        broker: 'Exness',
        investor_password: '@Cent1000000',
        account_type: 'cent',
        currency: 'USC',
        leverage: 2000,
        balance: 2106.2,
        equity: 2106.2,
        floating_pnl: 0,
        status: 'connected',
        sync_mode: 'local',
        last_sync: new Date()
      },
      create: {
        id: accountId,
        user_id: user.id,
        name: 'Road To 10000 Cent',
        broker: 'Exness',
        server: 'Exness-MT5Real25',
        login: '183766634',
        investor_password: '@Cent1000000',
        account_type: 'cent',
        currency: 'USC',
        leverage: 2000,
        balance: 2106.2,
        equity: 2106.2,
        floating_pnl: 0,
        status: 'connected',
        sync_mode: 'local',
        last_sync: new Date(),
        created_at: new Date()
      }
    });
    console.log('Account in Neon:', acc);

    console.log('4. Upserting 6 real trades into Neon DB...');
    for (const d of REAL_DEALS) {
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
          close_time: d.close_time
        },
        create: {
          ticket: d.ticket,
          account_id: acc.id,
          user_id: user.id,
          symbol: d.symbol,
          order_type: d.order_type,
          lots: d.lots,
          open_price: d.open_price,
          close_price: d.close_price,
          open_time: d.open_time,
          close_time: d.close_time,
          profit: d.profit,
          commission: d.commission,
          swap: d.swap,
          strategy: d.strategy,
          session: d.session,
          notes: d.notes,
          rule_followed: true,
          psychology_state: 'Disciplined',
          mistake_tag: 'None'
        }
      });
    }

    console.log('5. Updating local data/accounts.json and data/trades.json for complete sync...');
    const accountsPath = path.join(__dirname, '..', 'data', 'accounts.json');
    if (fs.existsSync(accountsPath)) {
      const accs = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
      const existingIdx = accs.findIndex((a: any) => a.login === '183766634' && a.server === 'Exness-MT5Real25');
      const jsonAcc = {
        id: acc.id,
        user_id: user.id,
        name: 'Road To 10000 Cent',
        broker: 'Exness',
        server: 'Exness-MT5Real25',
        login: '183766634',
        investor_password: '@Cent1000000',
        account_type: 'cent',
        currency: 'USC',
        leverage: 2000,
        balance: 2106.2,
        equity: 2106.2,
        floating_pnl: 0,
        status: 'connected',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sync_mode: 'local'
      };
      if (existingIdx !== -1) {
        accs[existingIdx] = jsonAcc;
      } else {
        accs.unshift(jsonAcc);
      }
      fs.writeFileSync(accountsPath, JSON.stringify(accs, null, 2), 'utf8');
      console.log('Saved to data/accounts.json');
    }

    const tradesPath = path.join(__dirname, '..', 'data', 'trades.json');
    if (fs.existsSync(tradesPath)) {
      const currentTrades = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
      for (const d of REAL_DEALS) {
        const found = currentTrades.find((t: any) => t.ticket === d.ticket);
        if (!found) {
          const maxId = currentTrades.length > 0 ? Math.max(...currentTrades.map((t: any) => t.id || 0)) : 0;
          currentTrades.unshift({
            id: maxId + 1,
            account_id: acc.id,
            user_id: user.id,
            ticket: d.ticket,
            symbol: d.symbol,
            order_type: d.order_type,
            lots: d.lots,
            open_price: d.open_price,
            close_price: d.close_price,
            open_time: d.open_time.toISOString(),
            close_time: d.close_time.toISOString(),
            profit: d.profit,
            commission: d.commission,
            swap: d.swap,
            strategy: d.strategy,
            session: d.session,
            notes: d.notes,
            rule_followed: true,
            psychology_state: 'Disciplined',
            mistake_tag: 'None'
          });
        }
      }
      fs.writeFileSync(tradesPath, JSON.stringify(currentTrades, null, 2), 'utf8');
      console.log('Saved to data/trades.json');
    }

    console.log('ALL SYNCED SUCCESSFULLY!');
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserAccount();
