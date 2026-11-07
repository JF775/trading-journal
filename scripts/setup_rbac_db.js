const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 1. Prepare Seed Users
const users = [
  {
    id: 'usr_admin_1',
    name: 'Jonathan Admin & Dev',
    email: 'admin@jfzla.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    provider: 'credentials',
    password_hash: hashPassword('password123'),
    role: 'admin',
    preferred_broker: 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 'usr_pro_1',
    name: 'Alex VIP PRO Trader',
    email: 'pro@jfzla.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    provider: 'credentials',
    password_hash: hashPassword('password123'),
    role: 'client_pro',
    preferred_broker: 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 'usr_affiliate_1',
    name: 'Rian Partner Affiliate',
    email: 'affiliate@jfzla.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    provider: 'credentials',
    password_hash: hashPassword('password123'),
    role: 'client_affiliate',
    preferred_broker: 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 'usr_starter_1',
    name: 'Dimas Starter Gratis',
    email: 'starter@jfzla.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    provider: 'credentials',
    password_hash: hashPassword('password123'),
    role: 'client_starter',
    preferred_broker: 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 'usr_1794054716904_vw4nr',
    name: 'Zila',
    email: 'zilajho@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=zilajho@gmail.com',
    provider: 'credentials',
    password_hash: '41981928488846958ccd6865d75f2996a9ba6549e280bbe4dfd93942c7da739d',
    role: 'client_starter',
    preferred_broker: 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  }
];

fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2), 'utf8');
console.log('Saved data/users.json with 4 distinct roles + Zila');

// 2. Prepare Distinct Accounts per User
const accounts = [
  // Admin Account (ROAD TO 1M CENT)
  {
    id: 'acc_exness_1794048966842',
    user_id: 'usr_admin_1',
    name: 'ROAD TO 1M CENT (Admin)',
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
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    sync_mode: 'local'
  },
  // VIP PRO Accounts (Unlimited capability)
  {
    id: 'acc_pro_xau',
    user_id: 'usr_pro_1',
    name: 'VIP Prop Firm Gold XAU',
    broker: 'Exness',
    server: 'Exness-MT5Real9',
    login: '9920194',
    investor_password: '@ProGold2026',
    account_type: 'standard',
    currency: 'USD',
    leverage: 500,
    balance: 50000.0,
    equity: 51420.5,
    floating_pnl: 1420.5,
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    sync_mode: 'remote'
  },
  {
    id: 'acc_pro_valetax',
    user_id: 'usr_pro_1',
    name: 'Valetax Cent Grid Pro',
    broker: 'Valetax',
    server: 'ValetaxIntl-Live',
    login: '4091823',
    investor_password: '@ValetaxCent',
    account_type: 'cent',
    currency: 'USC',
    leverage: 1000,
    balance: 154200.0,
    equity: 154050.0,
    floating_pnl: -150.0,
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    sync_mode: 'remote'
  },
  // Partner Affiliate Accounts (Max 3, Exness/HFM/Valetax)
  {
    id: 'acc_affiliate_exness',
    user_id: 'usr_affiliate_1',
    name: 'Exness Cent Partner #1',
    broker: 'Exness',
    server: 'Exness-MT5Real12',
    login: '8829104',
    investor_password: '@Affiliate123',
    account_type: 'cent',
    currency: 'USC',
    leverage: 2000,
    balance: 85200.0,
    equity: 85200.0,
    floating_pnl: 0,
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    sync_mode: 'remote'
  },
  {
    id: 'acc_affiliate_hfm',
    user_id: 'usr_affiliate_1',
    name: 'HFM Micro Partner #2',
    broker: 'HFM',
    server: 'HFMarkets-Live',
    login: '3391024',
    investor_password: '@HfmPartner',
    account_type: 'cent',
    currency: 'USC',
    leverage: 1000,
    balance: 42300.0,
    equity: 42110.0,
    floating_pnl: -190.0,
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    sync_mode: 'remote'
  },
  // Starter Account (Max 1)
  {
    id: 'acc_starter_cent',
    user_id: 'usr_starter_1',
    name: 'Cent Starter Demo #1',
    broker: 'Exness',
    server: 'Exness-MT5Trial',
    login: '1102934',
    account_type: 'cent',
    currency: 'USC',
    leverage: 1000,
    balance: 10000.0,
    equity: 10000.0,
    floating_pnl: 0,
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    sync_mode: 'local'
  }
];

fs.writeFileSync('data/accounts.json', JSON.stringify(accounts, null, 2), 'utf8');
console.log('Saved data/accounts.json with per-user accounts');

// 3. Prepare Distinct Trades with user_id & account_id
// Load current trades if any
let existingTrades = [];
try {
  existingTrades = JSON.parse(fs.readFileSync('data/trades.json', 'utf8'));
} catch (e) {}

// Tag existing trades with admin account
const updatedTrades = [];
for (const t of existingTrades) {
  updatedTrades.push({
    ...t,
    user_id: 'usr_admin_1',
    account_id: 'acc_exness_1794048966842'
  });
}

// Add sample trades for VIP PRO
updatedTrades.push(
  {
    id: 9001,
    user_id: 'usr_pro_1',
    account_id: 'acc_pro_xau',
    ticket: '749101',
    symbol: 'XAUUSD',
    order_type: 'BUY',
    lots: 1.0,
    open_price: 2710.5,
    close_price: 2725.0,
    open_time: new Date(Date.now() - 3600000 * 5).toISOString(),
    close_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    profit: 1450.0,
    commission: -10,
    swap: 0,
    strategy: 'London Gold Breakout',
    session: 'London',
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None'
  },
  {
    id: 9002,
    user_id: 'usr_pro_1',
    account_id: 'acc_pro_valetax',
    ticket: '749102',
    symbol: 'EURUSD',
    order_type: 'SELL',
    lots: 0.2,
    open_price: 1.085,
    close_price: 1.082,
    open_time: new Date(Date.now() - 3600000 * 8).toISOString(),
    close_time: new Date(Date.now() - 3600000 * 4).toISOString(),
    profit: 600.0,
    commission: -2,
    swap: 0,
    strategy: 'Cent EA Grid',
    session: 'New York',
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None'
  }
);

// Add sample trades for Partner Affiliate
updatedTrades.push(
  {
    id: 8001,
    user_id: 'usr_affiliate_1',
    account_id: 'acc_affiliate_exness',
    ticket: '649101',
    symbol: 'GBPUSD',
    order_type: 'BUY',
    lots: 0.1,
    open_price: 1.295,
    close_price: 1.301,
    open_time: new Date(Date.now() - 86400000).toISOString(),
    close_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    profit: 600.0,
    commission: -1,
    swap: 0,
    strategy: 'Asian Session Scalp',
    session: 'Asian',
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None'
  }
);

// Add sample trades for Starter
updatedTrades.push(
  {
    id: 7001,
    user_id: 'usr_starter_1',
    account_id: 'acc_starter_cent',
    ticket: '549101',
    symbol: 'EURUSD',
    order_type: 'BUY',
    lots: 0.05,
    open_price: 1.082,
    close_price: 1.085,
    open_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    close_time: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    profit: 150.0,
    commission: 0,
    swap: 0,
    strategy: 'Cent EA Grid',
    session: 'London',
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None'
  }
);

fs.writeFileSync('data/trades.json', JSON.stringify(updatedTrades, null, 2), 'utf8');
console.log('Saved data/trades.json with per-user trades');
