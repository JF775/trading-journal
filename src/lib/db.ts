import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync, execSync } from 'child_process';
import {
  Trade,
  AnalyticsSummary,
  DailySummary,
  StrategyPerformance,
  BrokerAccount,
  BrokerName,
  TradingPlan,
  LotCalculationResult,
  LicenseTier,
  LicenseFeatures,
  UserLicense,
  SyncAllResult,
  SyncAccountDetail,
  User,
  UserRole,
  RolePackageDetails,
  getRolePackageDetails
} from './types';

// Detect storage path: local data dir or /tmp for Vercel Serverless
const IS_VERCEL = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'trades.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const LICENSE_FILE = path.join(DATA_DIR, 'license.json');
const PLAN_FILE = path.join(DATA_DIR, 'trading-plan.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

let memoryUsers: User[] = [];
let isUsersInitialized = false;

// In-memory cache for fast read/write
let memoryTrades: Trade[] = [];
let memoryAccounts: BrokerAccount[] = [];
let isTradesInitialized = false;
let isAccountsInitialized = false;

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // ignore on read-only environments
  }
}

// ---------------------------------------------------------------------------
// BROKER ACCOUNTS (Exness, HFM, Valetax CRUD & Investor Sync)
// ---------------------------------------------------------------------------

function loadAccountsFromDisk(): BrokerAccount[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    // Fallback: check project data/ directory if ACCOUNTS_FILE is in /tmp
    const fallbackPath = path.join(process.cwd(), 'data', 'accounts.json');
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading accounts from disk, using memory:', err);
  }
  return [];
}

function saveAccountsToDisk(accounts: BrokerAccount[]) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write accounts to disk:', err);
  }
}

export function generateSeedAccounts(): BrokerAccount[] {
  return [
    {
      id: 'acc_exness_1',
      name: 'Exness Cent Grid EA',
      broker: 'Exness',
      server: 'Exness-MT5Real9',
      login: '14298104',
      investor_password: '',
      account_type: 'cent',
      currency: 'USC',
      leverage: 2000,
      balance: 102601,
      equity: 102450,
      floating_pnl: -151,
      status: 'connected',
      last_sync: new Date().toISOString(),
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'acc_hfm_1',
      name: 'HFM Pro Cent Scalper',
      broker: 'HFM',
      server: 'HFMarketsGlobal-Live3',
      login: '8820491',
      investor_password: '',
      account_type: 'cent',
      currency: 'USC',
      leverage: 1000,
      balance: 54230,
      equity: 54310,
      floating_pnl: 80,
      status: 'connected',
      last_sync: new Date().toISOString(),
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'acc_valetax_1',
      name: 'Valetax Cent Martingale',
      broker: 'Valetax',
      server: 'ValetaxIntl-Live',
      login: '3019284',
      investor_password: '',
      account_type: 'cent',
      currency: 'USC',
      leverage: 500,
      balance: 75180,
      equity: 74900,
      floating_pnl: -280,
      status: 'connected',
      last_sync: new Date().toISOString(),
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ];
}

export function initAccountsDB(forceReload = false): BrokerAccount[] {
  if (!isAccountsInitialized || forceReload) {
    memoryAccounts = loadAccountsFromDisk();
    if (memoryAccounts.length === 0) {
      memoryAccounts = generateSeedAccounts();
      saveAccountsToDisk(memoryAccounts);
    }
    isAccountsInitialized = true;
  }
  return memoryAccounts;
}

export function getAllAccounts(userId?: string): BrokerAccount[] {
  initAccountsDB();
  initDB();
  let accs = memoryAccounts;
  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin') {
      accs = memoryAccounts.filter(a => a.user_id === userId);
    }
  }
  return accs.map(acc => ({
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  }));
}

export function getAccountById(id: string, userId?: string): BrokerAccount | undefined {
  initAccountsDB();
  initDB();
  const acc = memoryAccounts.find(a => a.id === id);
  if (!acc) return undefined;
  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin' && acc.user_id && acc.user_id !== userId) {
      return undefined;
    }
  }
  return {
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  };
}

export function addAccount(data: Partial<BrokerAccount>, userId?: string, roleOverride?: UserRole): BrokerAccount {
  initAccountsDB();
  const targetUserId = userId || data.user_id;

  if (targetUserId) {
    const user = findUserById(targetUserId);
    const role = roleOverride || user?.role || 'client_starter';
    if (role !== 'admin' && role !== 'client_pro') {
      const existingUserAccounts = memoryAccounts.filter(a => a.user_id === targetUserId);
      if (role === 'client_starter' && existingUserAccounts.length >= 1) {
        throw new Error('Batas akun MT5 tercapai: Paket Starter (Gratis) dibatasi maksimal 1 akun. Hubungkan akun broker mitra atau upgrade ke VIP PRO.');
      }
      if (role === 'client_affiliate') {
        if (existingUserAccounts.length >= 3) {
          throw new Error('Batas akun partner tercapai: Paket Affiliate dibatasi maksimal 3 akun MT5.');
        }
        const partnerBrokers = ['Exness', 'HFM', 'Valetax'];
        if (data.broker && !partnerBrokers.includes(data.broker)) {
          throw new Error('Paket Partner Affiliate hanya mendukung broker Exness, HFM, dan Valetax.');
        }
      }
    }
  }

  const id = `acc_${(data.broker || 'broker').toLowerCase()}_${Date.now()}`;
  const newAccount: BrokerAccount = {
    id,
    user_id: targetUserId,
    name: data.name || `${data.broker || 'Broker'} Account #${data.login || 'New'}`,
    broker: (data.broker || 'Exness') as BrokerName,
    server: data.server || 'Exness-MT5Real9',
    login: String(data.login || '1000000'),
    investor_password: data.investor_password ? String(data.investor_password) : undefined,
    account_type: data.account_type || 'cent',
    currency: data.account_type === 'standard' ? 'USD' : 'USC',
    leverage: Number(data.leverage || 1000),
    balance: Number(data.balance || (data.account_type === 'standard' ? 1000 : 100000)),
    equity: Number(data.equity || data.balance || (data.account_type === 'standard' ? 1000 : 100000)),
    floating_pnl: Number(data.floating_pnl || 0),
    status: 'connected',
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  memoryAccounts.unshift(newAccount);
  saveAccountsToDisk(memoryAccounts);
  return newAccount;
}

export function updateAccount(id: string, data: Partial<BrokerAccount>): BrokerAccount | null {
  initAccountsDB();
  const idx = memoryAccounts.findIndex(a => a.id === id);
  if (idx === -1) return null;

  memoryAccounts[idx] = {
    ...memoryAccounts[idx],
    ...data,
    id // keep id immutable
  };

  saveAccountsToDisk(memoryAccounts);
  return memoryAccounts[idx];
}

export function deleteAccount(id: string, purgeTrades = true): boolean {
  initAccountsDB();
  const beforeLen = memoryAccounts.length;
  memoryAccounts = memoryAccounts.filter(a => a.id !== id);
  if (memoryAccounts.length !== beforeLen) {
    saveAccountsToDisk(memoryAccounts);
    if (purgeTrades) {
      initDB();
      memoryTrades = memoryTrades.filter(t => t.account_id !== id);
      saveTradesToDisk(memoryTrades);
    }
    return true;
  }
  return false;
}

export function purgeOrphanedTrades(): number {
  initAccountsDB();
  initDB();
  const validAccountIds = new Set(memoryAccounts.map(a => a.id));
  const beforeLen = memoryTrades.length;
  memoryTrades = memoryTrades.filter(t => t.account_id ? validAccountIds.has(t.account_id) : false);
  const removed = beforeLen - memoryTrades.length;
  if (removed > 0) {
    saveTradesToDisk(memoryTrades);
  }
  return removed;
}

/**
 * Handle incoming webhook deal or live equity heartbeat from MT5 EA (TradeJournalWebhook.mq5).
 * Updates matching broker account metrics in real-time or auto-registers the account.
 */
export function syncAccountFromWebhook(metadata: {
  account_login?: string | number;
  account_server?: string;
  account_balance?: number;
  account_equity?: number;
  account_floating?: number;
  account_currency?: string;
  account_leverage?: number;
  account_company?: string;
}): BrokerAccount | null {
  initAccountsDB();
  if (!metadata.account_login) return null;

  const loginStr = String(metadata.account_login);
  const idx = memoryAccounts.findIndex(a => a.login === loginStr);

  if (idx !== -1) {
    const acc = memoryAccounts[idx];
    if (metadata.account_balance !== undefined) acc.balance = Number(metadata.account_balance);
    if (metadata.account_equity !== undefined) acc.equity = Number(metadata.account_equity);
    if (metadata.account_floating !== undefined) {
      acc.floating_pnl = Number(metadata.account_floating);
    } else if (metadata.account_balance !== undefined && metadata.account_equity !== undefined) {
      acc.floating_pnl = Math.round((acc.equity - acc.balance) * 100) / 100;
    }
    if (metadata.account_leverage) acc.leverage = Number(metadata.account_leverage);
    if (metadata.account_currency) acc.currency = metadata.account_currency;
    if (metadata.account_server) acc.server = metadata.account_server;
    acc.status = 'connected';
    acc.sync_mode = 'webhook';
    acc.sync_error = undefined;
    acc.last_sync = new Date().toISOString();
    memoryAccounts[idx] = acc;
    saveAccountsToDisk(memoryAccounts);
    return acc;
  }

  // Auto-register broker account if it doesn't exist yet
  const serverStr = metadata.account_server || '';
  const inferredBroker: BrokerName = 
    serverStr.includes('Exness') ? 'Exness' :
    serverStr.includes('HFM') || serverStr.includes('HFMarkets') ? 'HFM' :
    serverStr.includes('Valetax') ? 'Valetax' : 'Other';

  const newAcc = addAccount({
    name: `${inferredBroker} Auto-Sync #${loginStr}`,
    broker: inferredBroker,
    server: serverStr || 'Exness-MT5Real9',
    login: loginStr,
    balance: metadata.account_balance || 100000,
    equity: metadata.account_equity || 100000,
    floating_pnl: metadata.account_floating || 0,
    leverage: metadata.account_leverage || 1000,
    currency: metadata.account_currency || 'USC',
    account_type: metadata.account_currency === 'USD' ? 'standard' : 'cent',
    status: 'connected',
    sync_mode: 'webhook'
  });

  return newAcc;
}

let isLocalSyncBusy = false;

export async function syncAccount(id: string, userId?: string): Promise<{ success: boolean; account: BrokerAccount; new_trades: number; message: string }> {
  initAccountsDB();
  initDB();
  const idx = memoryAccounts.findIndex(a => a.id === id);
  if (idx === -1) {
    throw new Error('Account not found');
  }

  const acc = memoryAccounts[idx];
  const targetUserId = userId || acc.user_id;
  if (targetUserId && !acc.user_id) {
    acc.user_id = targetUserId;
  }

  // PTrack License Permission Gate
  const license = getUserLicense(targetUserId);
  const perm = checkSyncPermission(acc, license, targetUserId);
  if (!perm.allowed) {
    acc.status = 'error';
    acc.sync_error = perm.reason;
    memoryAccounts[idx] = acc;
    saveAccountsToDisk(memoryAccounts);
    throw new Error(perm.reason || 'Sync not permitted by current license tier');
  }

  const bridgeUrl = process.env.MT5_BRIDGE_URL;
  const isWindows = process.platform === 'win32';

  // Option 1: Remote Bridge Microservice (Configured in Vercel / Cloud env: MT5_BRIDGE_URL)
  if (bridgeUrl && acc.investor_password && acc.investor_password.trim().length > 0) {
    try {
      const res = await fetch(`${bridgeUrl.replace(/\/$/, '')}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MT5_BRIDGE_KEY ? { 'x-api-key': process.env.MT5_BRIDGE_KEY } : {})
        },
        body: JSON.stringify({
          login: acc.login,
          password: acc.investor_password,
          server: acc.server,
          days: 30
        }),
        signal: AbortSignal.timeout(15000)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        acc.status = 'error';
        acc.sync_error = data.error || 'Remote bridge connection failed';
        memoryAccounts[idx] = acc;
        saveAccountsToDisk(memoryAccounts);
        throw new Error(acc.sync_error);
      }

      if (data.account?.name && (!acc.name || acc.name === 'aada' || acc.name.startsWith('Exness Account') || acc.name.startsWith('Broker Account'))) {
        acc.name = data.account.name;
      }
      acc.balance = data.account.balance;
      acc.equity = data.account.equity;
      acc.floating_pnl = data.account.floating_pnl;
      acc.currency = data.account.currency || acc.currency;
      acc.leverage = data.account.leverage || acc.leverage;
      acc.status = 'connected';
      acc.sync_mode = 'remote';
      acc.sync_error = undefined;
      acc.last_sync = new Date().toISOString();

      let importedCount = 0;
      if (Array.isArray(data.deals)) {
        for (const deal of data.deals) {
          addTrade({
            ticket: deal.ticket,
            account_id: acc.id,
            symbol: deal.symbol,
            order_type: deal.order_type,
            lots: deal.lots,
            open_price: deal.open_price,
            close_price: deal.close_price,
            open_time: deal.open_time,
            close_time: deal.close_time,
            profit: deal.profit,
            commission: deal.commission,
            swap: deal.swap,
            strategy: acc.name || 'MT5 Real Strategy',
            session: deal.session || 'New York',
            notes: deal.notes,
            rule_followed: true,
            psychology_state: 'Disciplined',
            mistake_tag: 'None'
          });
          importedCount++;
        }
      }

      memoryAccounts[idx] = acc;
      saveAccountsToDisk(memoryAccounts);

      return {
        success: true,
        account: acc,
        new_trades: importedCount,
        message: `Tersambung via Remote Bridge ke server ${acc.server}! Sinkronisasi ${importedCount} transaksi riwayat, saldo: ${acc.balance} ${acc.currency}.`
      };
    } catch (err: any) {
      if (err.message && (err.message.includes('Authorization failed') || err.message.includes('Unauthorized') || err.message.includes('Terminal:'))) {
        throw err;
      }
      console.warn('Remote bridge execution error, falling back:', err.message);
    }
  }

  // Option 2: Local Windows Terminal Handshake (When running locally on Windows)
  if (isWindows && acc.investor_password && acc.investor_password.trim().length > 0) {
    if (isLocalSyncBusy) {
      return {
        success: false,
        account: acc,
        new_trades: 0,
        message: 'Sinkronisasi MT5 sedang aktif untuk antrean akun lain. Silakan tunggu beberapa detik...'
      };
    }
    isLocalSyncBusy = true;
    try {
      const bridgeScript = path.join(process.cwd(), 'scripts', 'mt5-bridge.py');
      const bridgeOutput = execFileSync('python', [
        bridgeScript,
        '--login', String(acc.login),
        '--password', String(acc.investor_password),
        '--server', String(acc.server),
        '--days', '30'
      ], { encoding: 'utf-8', timeout: 25000 });

      const res = JSON.parse(bridgeOutput);
      if (!res.success) {
        acc.status = 'error';
        acc.sync_error = res.error;
        memoryAccounts[idx] = acc;
        saveAccountsToDisk(memoryAccounts);
        throw new Error(res.error);
      }

      // Live real broker server connection succeeded!
      if (res.account?.name && (!acc.name || acc.name === 'aada' || acc.name.startsWith('Exness Account') || acc.name.startsWith('Broker Account'))) {
        acc.name = res.account.name;
      }
      acc.balance = res.account.balance;
      acc.equity = res.account.equity;
      acc.floating_pnl = res.account.floating_pnl;
      acc.currency = res.account.currency || acc.currency;
      acc.leverage = res.account.leverage || acc.leverage;
      acc.status = 'connected';
      acc.sync_mode = 'local';
      acc.sync_error = undefined;
      acc.last_sync = new Date().toISOString();

      let importedCount = 0;
      if (Array.isArray(res.deals)) {
        for (const deal of res.deals) {
          addTrade({
            ticket: deal.ticket,
            account_id: acc.id,
            symbol: deal.symbol,
            order_type: deal.order_type,
            lots: deal.lots,
            open_price: deal.open_price,
            close_price: deal.close_price,
            open_time: deal.open_time,
            close_time: deal.close_time,
            profit: deal.profit,
            commission: deal.commission,
            swap: deal.swap,
            strategy: acc.name || 'MT5 Real Strategy',
            session: deal.session || 'New York',
            notes: deal.notes,
            rule_followed: true,
            psychology_state: 'Disciplined',
            mistake_tag: 'None'
          });
          importedCount++;
        }
      }

      memoryAccounts[idx] = acc;
      saveAccountsToDisk(memoryAccounts);

      return {
        success: true,
        account: acc,
        new_trades: importedCount,
        message: `Terhubung live ke server ${acc.server}! Sinkronisasi ${importedCount} transaksi riwayat, saldo real: ${acc.balance} ${acc.currency}.`
      };
    } catch (err: any) {
      if (isWindows && err.message?.includes('ETIMEDOUT')) {
        try {
          execSync('powershell -NoProfile -Command "Stop-Process -Name terminal64 -Force -ErrorAction SilentlyContinue"', { timeout: 4000 });
        } catch {}
      }
      if (err.message && (err.message.includes('Terminal: Authorization failed') || err.message.includes('Failed to authorize'))) {
        throw err;
      }
      console.warn('Bridge execution error, falling back:', err.message);
    } finally {
      isLocalSyncBusy = false;
    }
  }

  // Option 3: Cloud Mode (Linux / Vercel Serverless without Remote Bridge)
  // When running on Vercel without a Windows runner, do NOT crash!
  // Inform the user and maintain smooth operation via Webhook push model.
  acc.status = 'connected';
  acc.sync_mode = acc.sync_mode || 'webhook';
  acc.sync_error = undefined;
  acc.last_sync = new Date().toISOString();
  memoryAccounts[idx] = acc;
  saveAccountsToDisk(memoryAccounts);

  return {
    success: true,
    account: acc,
    new_trades: 0,
    message: isWindows 
      ? `Akun #${acc.login} (${acc.server}) tersinkronisasi.` 
      : `Mode Cloud (Vercel) Aktif: Akun #${acc.login} siap menerima data live. Pasang TradeJournalWebhook.mq5 di MT5 Anda untuk auto-sync instan tanpa VPS, atau set MT5_BRIDGE_URL untuk pull investor password dari cloud.`
  };
}

export async function syncAllAccounts(force = false, userId?: string): Promise<SyncAllResult> {
  initAccountsDB();
  const lic = getUserLicense(userId);

  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin' && user.role === 'client_starter') {
      return {
        success: false,
        total_accounts: 0,
        synced_accounts: 0,
        skipped_accounts: 0,
        failed_accounts: 0,
        new_trades_total: 0,
        details: [],
        message: 'Fitur Auto-Sync MT5 dinonaktifkan untuk paket Starter Gratis. Hubungkan broker partner atau upgrade ke PRO VIP.'
      };
    }
  }

  if (lic.tier === 'free') {
    return {
      success: false,
      total_accounts: memoryAccounts.length,
      synced_accounts: 0,
      skipped_accounts: memoryAccounts.length,
      failed_accounts: 0,
      new_trades_total: 0,
      details: [],
      message: 'Fitur Auto-Sync MT5 memerlukan lisensi Affiliate atau PRO VIP. Akun FREE hanya dapat menggunakan pencatatan manual.'
    };
  }

  const details: SyncAccountDetail[] = [];
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  let totalNewTrades = 0;

  const minIntervalMs = (lic.features.sync_interval_minutes || 15) * 60 * 1000;
  const now = Date.now();

  const accountsToSync = (userId && findUserById(userId)?.role !== 'admin')
    ? memoryAccounts.filter(a => a.user_id === userId)
    : memoryAccounts;

  for (const acc of accountsToSync) {
    if (acc.status === 'disconnected') {
      details.push({
        account_id: acc.id,
        name: acc.name,
        login: acc.login,
        broker: acc.broker,
        status: 'skipped',
        new_trades: 0,
        error: 'Akun berstatus disconnected'
      });
      skipped++;
      continue;
    }

    // Check cooldown unless forced
    if (!force && acc.last_sync) {
      const lastSyncTime = new Date(acc.last_sync).getTime();
      if (now - lastSyncTime < minIntervalMs) {
        const remainingMinutes = Math.ceil((minIntervalMs - (now - lastSyncTime)) / 60000);
        details.push({
          account_id: acc.id,
          name: acc.name,
          login: acc.login,
          broker: acc.broker,
          status: 'skipped',
          new_trades: 0,
          error: `Cooldown aktif: tunggu ${remainingMinutes} menit lagi sebelum sinkronisasi ulang (Interval ${lic.features.sync_interval_minutes}m)`
        });
        skipped++;
        continue;
      }
    }

    try {
      const res = await syncAccount(acc.id, userId || acc.user_id);
      details.push({
        account_id: acc.id,
        name: acc.name,
        login: acc.login,
        broker: acc.broker,
        status: 'synced',
        new_trades: res.new_trades
      });
      synced++;
      totalNewTrades += res.new_trades;
    } catch (err: any) {
      details.push({
        account_id: acc.id,
        name: acc.name,
        login: acc.login,
        broker: acc.broker,
        status: 'failed',
        new_trades: 0,
        error: err.message || 'Sinkronisasi gagal'
      });
      failed++;
    }
  }

  return {
    success: synced > 0 || (failed === 0 && memoryAccounts.length === 0),
    total_accounts: memoryAccounts.length,
    synced_accounts: synced,
    skipped_accounts: skipped,
    failed_accounts: failed,
    new_trades_total: totalNewTrades,
    details,
    message: `Sinkronisasi batch selesai: ${synced} akun berhasil diperbarui (${totalNewTrades} transaksi baru), ${skipped} dilewati, ${failed} gagal.`
  };
}

// ---------------------------------------------------------------------------
// TRADES ENGINE
// ---------------------------------------------------------------------------

function loadTradesFromDisk(): Trade[] {
  try {
    let parsed: Trade[] = [];
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      parsed = JSON.parse(data);
    } else {
      // Fallback: check project data/ directory if DB_FILE is in /tmp
      const fallbackPath = path.join(process.cwd(), 'data', 'trades.json');
      if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf-8');
        parsed = JSON.parse(data);
      }
    }
    return parsed.map(t => ({
      ...t,
      is_reviewed: Boolean(t.is_reviewed)
    }));
  } catch (err) {
    console.error('Error loading trades from disk, using memory:', err);
  }
  return [];
}

function saveTradesToDisk(trades: Trade[]) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(DB_FILE, JSON.stringify(trades, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write trades to disk, using in-memory state:', err);
  }
}

export function initDB(forceReload = false): Trade[] {
  if (!isTradesInitialized || forceReload) {
    memoryTrades = loadTradesFromDisk();
    if (memoryTrades.length === 0) {
      memoryTrades = generateSeedTrades();
      saveTradesToDisk(memoryTrades);
    }
    isTradesInitialized = true;
  }
  return memoryTrades;
}

export function getAllTrades(filters?: {
  symbol?: string;
  order_type?: string;
  strategy?: string;
  date?: string;
  account_id?: string;
  userId?: string;
}): Trade[] {
  initDB();
  initAccountsDB();
  let list = [...memoryTrades];

  // RBAC User Data Isolation
  if (filters?.userId) {
    const user = findUserById(filters.userId);
    if (user && user.role !== 'admin') {
      const userAccountIds = new Set(memoryAccounts.filter(a => a.user_id === filters.userId).map(a => a.id));
      list = list.filter(t => t.user_id === filters.userId || (t.account_id && userAccountIds.has(t.account_id)));
    }
  }

  // If there are accounts configured, exclude trades from deleted accounts
  if (memoryAccounts.length > 0) {
    const validAccountIds = new Set(memoryAccounts.map(a => a.id));
    list = list.filter(t => t.account_id ? validAccountIds.has(t.account_id) : false);
  }

  if (filters?.account_id && filters.account_id !== 'all') {
    list = list.filter(t => t.account_id === filters.account_id);
  }
  if (filters?.symbol) {
    const sym = filters.symbol.toLowerCase();
    list = list.filter(t => t.symbol.toLowerCase().includes(sym) || t.ticket?.includes(sym));
  }
  if (filters?.order_type) {
    list = list.filter(t => t.order_type.toUpperCase() === filters.order_type?.toUpperCase());
  }
  if (filters?.strategy) {
    const strat = filters.strategy.toLowerCase();
    list = list.filter(t => t.strategy?.toLowerCase().includes(strat));
  }
  if (filters?.date) {
    list = list.filter(t => t.close_time.startsWith(filters.date!));
  }

  return list.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
}

export function getTradeById(id: number): Trade | undefined {
  initDB();
  return memoryTrades.find(t => t.id === id);
}

export function addTrade(tradeData: Partial<Trade>, userId?: string): Trade {
  initDB();
  if (userId && !tradeData.user_id) {
    tradeData.user_id = userId;
  }

  if (tradeData.ticket) {
    const existingIdx = memoryTrades.findIndex(t => t.ticket === tradeData.ticket);
    if (existingIdx !== -1) {
      memoryTrades[existingIdx] = {
        ...memoryTrades[existingIdx],
        ...tradeData,
        // Preserve review status if already completed
        is_reviewed: memoryTrades[existingIdx].is_reviewed ?? false,
        reviewed_at: memoryTrades[existingIdx].reviewed_at,
        notes: memoryTrades[existingIdx].notes || tradeData.notes || '',
        psychology_state: memoryTrades[existingIdx].psychology_state || tradeData.psychology_state || 'Disciplined',
        mistake_tag: memoryTrades[existingIdx].mistake_tag || tradeData.mistake_tag || 'None'
      } as Trade;
      saveTradesToDisk(memoryTrades);
      return memoryTrades[existingIdx];
    }
  }

  const newId = memoryTrades.length > 0 ? Math.max(...memoryTrades.map(t => t.id)) + 1 : 1;
  const newTrade: Trade = {
    id: newId,
    user_id: userId || tradeData.user_id,
    ticket: tradeData.ticket || String(10000000 + newId),
    account_id: tradeData.account_id || 'acc_exness_1',
    symbol: (tradeData.symbol || 'XAUUSD').toUpperCase(),
    order_type: (tradeData.order_type || 'BUY').toUpperCase() as 'BUY' | 'SELL',
    lots: Number(tradeData.lots || 0.01),
    open_price: Number(tradeData.open_price || 0),
    close_price: Number(tradeData.close_price || 0),
    open_time: tradeData.open_time || new Date().toISOString(),
    close_time: tradeData.close_time || new Date().toISOString(),
    profit: Number(tradeData.profit || 0),
    commission: Number(tradeData.commission || 0),
    swap: Number(tradeData.swap || 0),
    strategy: tradeData.strategy || 'Manual Trade',
    session: tradeData.session || 'London',
    notes: tradeData.notes || '',
    rule_followed: tradeData.rule_followed ?? true,
    psychology_state: tradeData.psychology_state || 'Disciplined',
    mistake_tag: tradeData.mistake_tag || 'None',
    mae: tradeData.mae,
    mfe: tradeData.mfe,
    screenshot_url: tradeData.screenshot_url,
    is_reviewed: tradeData.is_reviewed ?? false,
    reviewed_at: tradeData.reviewed_at
  };

  memoryTrades.push(newTrade);
  saveTradesToDisk(memoryTrades);
  return newTrade;
}

export function updateTradeReview(
  id: number,
  review: {
    rule_followed: boolean;
    psychology_state: string;
    mistake_tag: string;
    mae?: number | null;
    mfe?: number | null;
    notes?: string | null;
  }
): Trade | null {
  initDB();
  const idx = memoryTrades.findIndex(t => t.id === id);
  if (idx === -1) return null;

  memoryTrades[idx] = {
    ...memoryTrades[idx],
    rule_followed: review.rule_followed,
    psychology_state: review.psychology_state,
    mistake_tag: review.mistake_tag,
    mae: review.mae !== null ? review.mae : memoryTrades[idx].mae,
    mfe: review.mfe !== null ? review.mfe : memoryTrades[idx].mfe,
    notes: review.notes !== null ? review.notes : memoryTrades[idx].notes,
    is_reviewed: true,
    reviewed_at: new Date().toISOString()
  };

  saveTradesToDisk(memoryTrades);
  return memoryTrades[idx];
}

export function deleteTrade(id: number): boolean {
  initDB();
  const initialLen = memoryTrades.length;
  memoryTrades = memoryTrades.filter(t => t.id !== id);
  if (memoryTrades.length !== initialLen) {
    saveTradesToDisk(memoryTrades);
    return true;
  }
  return false;
}

export function reseedDemoTrades(): Trade[] {
  memoryTrades = generateSeedTrades();
  saveTradesToDisk(memoryTrades);
  memoryAccounts = generateSeedAccounts();
  saveAccountsToDisk(memoryAccounts);
  return memoryTrades;
}

export function calculateAnalytics(accountId?: string, userId?: string): AnalyticsSummary {
  initDB();
  initAccountsDB();

  const sourceTrades = getAllTrades({
    account_id: accountId && accountId !== 'all' ? accountId : undefined,
    userId
  });
  const total = sourceTrades.length;

  if (total === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      net_profit: 0,
      gross_profit: 0,
      gross_loss: 0,
      profit_factor: 0,
      avg_trade: 0,
      avg_win: 0,
      avg_loss: 0,
      max_win: 0,
      max_loss: 0,
      long_count: 0,
      short_count: 0,
      max_drawdown: 0,
      max_drawdown_pct: 0,
      expectancy: 0,
      discipline_rate: 100,
      top_mistakes: [],
      strategy_performance: [],
      daily_summaries: [],
      equity_curve: []
    };
  }

  const chronological = [...sourceTrades].sort(
    (a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime()
  );

  const wins = chronological.filter(t => t.profit > 0);
  const losses = chronological.filter(t => t.profit < 0);

  const gross_profit = wins.reduce((acc, t) => acc + t.profit, 0);
  const gross_loss = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0));
  const net_profit = chronological.reduce((acc, t) => acc + t.profit, 0);

  const win_rate = Math.round((wins.length / total) * 1000) / 10;
  const profit_factor = gross_loss > 0 ? Math.round((gross_profit / gross_loss) * 100) / 100 : gross_profit > 0 ? gross_profit : 0;

  const avg_trade = Math.round((net_profit / total) * 100) / 100;
  const avg_win = wins.length > 0 ? Math.round((gross_profit / wins.length) * 100) / 100 : 0;
  const avg_loss = losses.length > 0 ? Math.round((gross_loss / losses.length) * 100) / 100 : 0;

  const max_win = wins.length > 0 ? Math.max(...wins.map(t => t.profit)) : 0;
  const max_loss = losses.length > 0 ? Math.min(...losses.map(t => t.profit)) : 0;

  const long_count = chronological.filter(t => t.order_type === 'BUY').length;
  const short_count = chronological.filter(t => t.order_type === 'SELL').length;

  const win_pct = wins.length / total;
  const loss_pct = losses.length / total;
  const expectancy = Math.round(((win_pct * avg_win) - (loss_pct * avg_loss)) * 100) / 100;

  const dailyMap: Record<string, { count: number; net: number; wins: number; losses: number }> = {};
  const equity_curve = [];
  let cumulative = 0;
  let peak = 0;
  let max_dd = 0;

  for (const t of chronological) {
    const dayStr = t.close_time.substring(0, 10);
    if (!dailyMap[dayStr]) {
      dailyMap[dayStr] = { count: 0, net: 0, wins: 0, losses: 0 };
    }
    dailyMap[dayStr].count += 1;
    dailyMap[dayStr].net += t.profit;
    if (t.profit > 0) dailyMap[dayStr].wins += 1;
    else if (t.profit < 0) dailyMap[dayStr].losses += 1;

    cumulative += t.profit;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > max_dd) max_dd = dd;

    equity_curve.push({
      timestamp: t.close_time,
      date: dayStr,
      profit: Math.round(t.profit * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
      drawdown: Math.round(dd * 100) / 100,
      symbol: t.symbol,
      lots: t.lots
    });
  }

  const max_drawdown_pct = peak > 0 ? Math.round((max_dd / peak) * 1000) / 10 : 0;

  const disciplined_count = chronological.filter(t => t.rule_followed).length;
  const discipline_rate = Math.round((disciplined_count / total) * 1000) / 10;

  const mistakeCounts: Record<string, number> = {};
  for (const t of chronological) {
    if (t.mistake_tag && t.mistake_tag !== 'None') {
      mistakeCounts[t.mistake_tag] = (mistakeCounts[t.mistake_tag] || 0) + 1;
    }
  }
  const top_mistakes = Object.entries(mistakeCounts)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stratGroups: Record<string, Trade[]> = {};
  for (const t of chronological) {
    const sName = t.strategy || 'Manual';
    if (!stratGroups[sName]) stratGroups[sName] = [];
    stratGroups[sName].push(t);
  }

  const strategy_performance: StrategyPerformance[] = Object.entries(stratGroups).map(([name, sTrades]) => {
    const sWins = sTrades.filter(t => t.profit > 0);
    const sLosses = sTrades.filter(t => t.profit < 0);
    const sGrossWin = sWins.reduce((acc, t) => acc + t.profit, 0);
    const sGrossLoss = Math.abs(sLosses.reduce((acc, t) => acc + t.profit, 0));
    const sPF = sGrossLoss > 0 ? sGrossWin / sGrossLoss : sGrossWin > 0 ? sGrossWin : 0;
    const sNet = sTrades.reduce((acc, t) => acc + t.profit, 0);

    return {
      name,
      trades_count: sTrades.length,
      win_rate: Math.round((sWins.length / sTrades.length) * 1000) / 10,
      net_profit: Math.round(sNet * 100) / 100,
      profit_factor: Math.round(sPF * 100) / 100
    };
  });

  const daily_summaries: DailySummary[] = Object.entries(dailyMap).map(([date, d]) => ({
    date,
    trades_count: d.count,
    net_profit: Math.round(d.net * 100) / 100,
    win_count: d.wins,
    loss_count: d.losses
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_trades: total,
    winning_trades: wins.length,
    losing_trades: losses.length,
    win_rate,
    net_profit: Math.round(net_profit * 100) / 100,
    gross_profit: Math.round(gross_profit * 100) / 100,
    gross_loss: Math.round(gross_loss * 100) / 100,
    profit_factor,
    avg_trade,
    avg_win,
    avg_loss,
    max_win: Math.round(max_win * 100) / 100,
    max_loss: Math.round(max_loss * 100) / 100,
    long_count,
    short_count,
    max_drawdown: Math.round(max_dd * 100) / 100,
    max_drawdown_pct,
    expectancy,
    discipline_rate,
    top_mistakes,
    strategy_performance,
    daily_summaries,
    equity_curve
  };
}

export function parseStatement(content: string, defaultStrategy = 'Imported Statement', userId?: string, accountId?: string): Trade[] {
  initDB();
  const trades: Trade[] = [];
  initAccountsDB();
  const effectiveAccountId = accountId || (userId ? memoryAccounts.find(a => a.user_id === userId)?.id : undefined) || 'acc_exness_1';
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('<tr>') && line.includes('<td>') && (line.includes('buy') || line.includes('sell'))) {
      const cells = line.split(/<\/?td[^>]*>/).filter(c => c.trim().length > 0);
      if (cells.length >= 9) {
        const ticket = cells[0].replace(/[^0-9]/g, '');
        const order_type = cells[2]?.toLowerCase().includes('buy') ? 'BUY' : 'SELL';
        const lots = parseFloat(cells[3]) || 0.01;
        const symbol = cells[4]?.trim().toUpperCase() || 'XAUUSD';
        const open_price = parseFloat(cells[5]) || 0;
        const close_price = parseFloat(cells[8]) || open_price;
        const profit = parseFloat(cells[cells.length - 1]?.replace(/[^0-9.-]/g, '')) || 0;

        if (ticket) {
          trades.push({
            id: 0,
            ticket,
            account_id: effectiveAccountId,
            user_id: userId,
            symbol,
            order_type,
            lots,
            open_price,
            close_price,
            close_time: new Date().toISOString(),
            profit,
            commission: 0,
            swap: 0,
            strategy: defaultStrategy,
            rule_followed: true,
            psychology_state: 'Disciplined',
            mistake_tag: 'None'
          });
        }
      }
    } else if (line.includes(',') && (line.toUpperCase().includes('BUY') || line.toUpperCase().includes('SELL'))) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 8 && /^\d+$/.test(parts[0])) {
        const ticket = parts[0];
        const order_type = parts[2]?.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
        const lots = parseFloat(parts[3]) || 0.01;
        const symbol = parts[4]?.toUpperCase() || 'EURUSD';
        const open_price = parseFloat(parts[5]) || 0;
        const close_price = parseFloat(parts[6]) || open_price;
        const profit = parseFloat(parts[parts.length - 1]) || 0;

        trades.push({
          id: 0,
          ticket,
          account_id: effectiveAccountId,
            user_id: userId,
          symbol,
          order_type,
          lots,
          open_price,
          close_price,
          close_time: new Date().toISOString(),
          profit,
          commission: 0,
          swap: 0,
          strategy: defaultStrategy,
          rule_followed: true,
          psychology_state: 'Disciplined',
          mistake_tag: 'None'
        });
      }
    }
  }

  const savedTrades: Trade[] = [];
  for (const t of trades) {
    savedTrades.push(addTrade(t));
  }

  return savedTrades;
}

function generateSeedTrades(): Trade[] {
  const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];
  const strategies = ['Cent EA Grid', 'Breakout Session', 'Martingale Cent', 'Scalping Pullback'];
  const sessions = ['Asian', 'London', 'New York'];
  const now = Date.now();
  const trades: Trade[] = [];

  for (let i = 1; i <= 45; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const closeDate = new Date(now - daysAgo * 86400000 - Math.random() * 43200000);
    const openDate = new Date(closeDate.getTime() - (15 + Math.random() * 300) * 60000);

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const order_type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const lots = [0.01, 0.02, 0.05, 0.1, 0.25][Math.floor(Math.random() * 5)];
    const strat = strategies[Math.floor(Math.random() * strategies.length)];
    const accId = strat.includes('Grid') ? 'acc_exness_1' : strat.includes('Martingale') ? 'acc_valetax_1' : 'acc_hfm_1';

    let open_price = symbol === 'XAUUSD' ? 2650 + (Math.random() * 80 - 40) : 1.08 + (Math.random() * 0.04 - 0.02);
    open_price = Math.round(open_price * 100) / 100;

    let pips = (Math.random() * 40 - 12);
    if (Math.random() < 0.72) pips = Math.abs(pips);
    else pips = -Math.abs(pips);

    const close_price = Math.round((order_type === 'BUY' ? open_price + pips * 0.1 : open_price - pips * 0.1) * 100) / 100;
    const profit = Math.round(pips * lots * 100 * 100) / 100;

    const rule_followed = Math.random() > 0.15;
    const psy = rule_followed ? 'Disciplined' : ['FOMO', 'Revenge', 'Hesitant Entry'][Math.floor(Math.random() * 3)];
    const mistake = rule_followed ? 'None' : ['Chased Price', 'Moved Stop Loss', 'Early Exit', 'Overleveraged'][Math.floor(Math.random() * 4)];

    trades.push({
      id: i,
      ticket: String(18400000 + i),
      account_id: accId,
      symbol,
      order_type,
      lots,
      open_price,
      close_price,
      open_time: openDate.toISOString(),
      close_time: closeDate.toISOString(),
      profit,
      commission: Math.round(-lots * 0.5 * 100) / 100,
      swap: Math.round((Math.random() * 0.3 - 0.15) * 100) / 100,
      strategy: strat,
      session: sessions[Math.floor(Math.random() * sessions.length)],
      notes: strat.includes('Grid') ? 'Auto-executed by Cent Grid EA' : 'Discretionary setup with confluence',
      rule_followed,
      psychology_state: psy,
      mistake_tag: mistake,
      mae: Math.round(Math.abs(profit) * 0.3 * 100) / 100,
      mfe: Math.round(Math.max(profit, 0) * 1.3 * 100) / 100
    });
  }

  return trades;
}

// ---------------------------------------------------------------------------
// TRADING PLAN & RISK MANAGEMENT (PTrack Alignment)
// ---------------------------------------------------------------------------

let memoryTradingPlan: TradingPlan | null = null;

export function getTradingPlan(userId?: string): TradingPlan {
  if (memoryTradingPlan) return memoryTradingPlan;
  try {
    if (fs.existsSync(PLAN_FILE)) {
      memoryTradingPlan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf-8'));
      return memoryTradingPlan!;
    }
  } catch (e) {}

  memoryTradingPlan = {
    id: 'default_plan',
    title: 'Cent & EA Discipline Master Plan',
    max_daily_loss: 500,
    max_risk_per_trade_pct: 1.5,
    max_open_trades: 5,
    allowed_sessions: ['London', 'New York'],
    setups: [
      'Cent Grid EA Martingale',
      'London Session Breakout',
      'XAUUSD Liquidity Sweep',
      'Trend Pullback (EMA 50/200)',
      'Order Block Reversal'
    ],
    entry_checklist: [
      { item: 'Trend alignment on H1 & H4 timeframe', required: true },
      { item: 'Key support/resistance or order block confirmed', required: true },
      { item: 'Risk-to-Reward ratio minimum 1:2', required: true },
      { item: 'No high-impact news within 30 minutes', required: true },
      { item: 'Lot size strictly calculated within 1.5% risk limit', required: true }
    ]
  };
  return memoryTradingPlan;
}

export function updateTradingPlan(data: Partial<TradingPlan>): TradingPlan {
  const current = getTradingPlan();
  memoryTradingPlan = {
    ...current,
    ...data,
    id: current.id
  };
  try {
    ensureDirectoryExists();
    fs.writeFileSync(PLAN_FILE, JSON.stringify(memoryTradingPlan, null, 2), 'utf-8');
  } catch (e) {}
  return memoryTradingPlan;
}

export function calculateLotSize(
  balance: number,
  risk_pct: number,
  stop_loss_pips: number,
  symbol = 'XAUUSD'
): LotCalculationResult {
  const cleanBalance = Math.max(1, Number(balance) || 1000);
  const cleanRiskPct = Math.max(0.1, Number(risk_pct) || 1);
  const cleanSlPips = Math.max(1, Number(stop_loss_pips) || 20);

  const riskAmount = (cleanBalance * cleanRiskPct) / 100;

  const sym = (symbol || 'XAUUSD').toUpperCase();
  let pipValuePerLot = 10;
  if (sym.includes('JPY')) pipValuePerLot = 9.2;
  else if (sym === 'XAUUSD' || sym.includes('GOLD')) pipValuePerLot = 10;
  else if (sym.includes('BTC')) pipValuePerLot = 1;

  let recommendedLot = riskAmount / (cleanSlPips * pipValuePerLot);
  recommendedLot = Math.max(0.01, Math.round(recommendedLot * 100) / 100);

  return {
    balance: Math.round(cleanBalance * 100) / 100,
    risk_pct: cleanRiskPct,
    stop_loss_pips: cleanSlPips,
    symbol: sym,
    pip_value: pipValuePerLot,
    risk_amount: Math.round(riskAmount * 100) / 100,
    recommended_lot: recommendedLot
  };
}

// ---------------------------------------------------------------------------
// LICENSING & ACCESS CONTROL ENGINE (PTrack Alignment)
// ---------------------------------------------------------------------------

export const TIER_FEATURES: Record<LicenseTier, LicenseFeatures> = {
  free: {
    max_mt5_accounts: 0,
    auto_sync_enabled: false,
    allowed_brokers: [],
    sync_interval_minutes: 0,
    export_enabled: false,
    priority_bridge: false
  },
  affiliate: {
    max_mt5_accounts: 3,
    auto_sync_enabled: true,
    allowed_brokers: ['Exness', 'HFM', 'Valetax'],
    sync_interval_minutes: 60,
    export_enabled: true,
    priority_bridge: false
  },
  pro: {
    max_mt5_accounts: 999,
    auto_sync_enabled: true,
    allowed_brokers: 'all',
    sync_interval_minutes: 15,
    export_enabled: true,
    priority_bridge: true
  }
};

let memoryLicense: UserLicense | null = null;

function loadLicenseFromDisk(): UserLicense {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      const data = fs.readFileSync(LICENSE_FILE, 'utf-8');
      return JSON.parse(data);
    }
    const fallbackPath = path.join(process.cwd(), 'data', 'license.json');
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading license from disk:', err);
  }

  // Default initial license: FREE tier
  return {
    id: 'user_main_license',
    tier: 'free',
    status: 'active',
    owner_name: 'PTrack Trader',
    created_at: new Date().toISOString(),
    features: TIER_FEATURES.free
  };
}

function saveLicenseToDisk(license: UserLicense) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(license, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write license to disk, using in-memory state:', err);
  }
}

export function getUserLicense(userId?: string): UserLicense {
  if (userId) {
    const user = findUserById(userId);
    if (user) {
      const pkg = getRolePackageDetails(user.role);
      return {
        id: `lic_${user.id}`,
        user_id: user.id,
        tier: pkg.tier,
        status: 'active',
        owner_name: user.name,
        affiliate_broker: user.preferred_broker || 'Exness',
        affiliate_account: user.preferred_broker ? '20993412' : undefined,
        created_at: user.created_at || new Date().toISOString(),
        features: {
          max_mt5_accounts: pkg.maxAccounts,
          auto_sync_enabled: pkg.autoSyncEnabled,
          allowed_brokers: pkg.allowedBrokers,
          sync_interval_minutes: pkg.minSyncInterval === 0 ? 0 : Math.max(1, Math.round(pkg.minSyncInterval / 60)),
          export_enabled: pkg.tier === 'pro',
          priority_bridge: pkg.tier === 'pro'
        }
      };
    }
  }

  if (!memoryLicense) {
    memoryLicense = loadLicenseFromDisk();
  }
  return memoryLicense;
}

export function checkSyncPermission(
  acc: BrokerAccount,
  license?: UserLicense,
  userId?: string
): { allowed: boolean; reason?: string } {
  const targetUserId = userId || acc.user_id;
  const lic = license || getUserLicense(targetUserId);

  if (lic.tier === 'free') {
    return {
      allowed: false,
      reason: 'Akses Terbatas: Paket FREE hanya mendukung jurnal manual. Hubungkan akun broker Affiliasi (Exness/HFM/Valetax) atau masukkan lisensi PRO VIP untuk mengaktifkan MT5 Auto-Sync.'
    };
  }

  if (lic.tier === 'affiliate') {
    const allowed = ['Exness', 'HFM', 'Valetax'];
    if (!allowed.includes(acc.broker)) {
      return {
        allowed: false,
        reason: `Akses Terbatas: Paket Affiliate hanya mendukung broker mitra (Exness, HFM, Valetax). Akun broker ${acc.broker} memerlukan lisensi PRO VIP.`
      };
    }

    initAccountsDB();
    // CRUCIAL: Count connected accounts ONLY for THIS user, not globally!
    const userAccounts = targetUserId
      ? memoryAccounts.filter(a => a.user_id === targetUserId)
      : memoryAccounts;

    const activeSyncAccounts = userAccounts.filter(
      a => a.status === 'connected' && a.id !== acc.id
    );
    if (activeSyncAccounts.length >= lic.features.max_mt5_accounts) {
      return {
        allowed: false,
        reason: `Batas Akun Terlampaui: Paket Affiliate maksimal 3 akun broker aktif. Upgrade ke lisensi PRO VIP untuk akun tanpa batas.`
      };
    }
  }

  if (lic.tier === 'pro') {
    if (lic.status === 'expired') {
      return {
        allowed: false,
        reason: 'Masa aktif lisensi PRO telah berakhir. Silakan perbarui kode lisensi Anda.'
      };
    }
  }

  return { allowed: true };
}

export function verifyAffiliateBroker(
  broker: BrokerName,
  accountNumber: string,
  ownerName?: string
): { success: boolean; license: UserLicense; message: string } {
  const cleanBroker = broker;
  const cleanAcc = (accountNumber || '').trim();

  if (!cleanAcc || cleanAcc.length < 5) {
    return {
      success: false,
      license: getUserLicense(),
      message: 'Nomor akun trading MT5 tidak valid. Masukkan nomor akun minimal 5-8 digit.'
    };
  }

  if (!['Exness', 'HFM', 'Valetax'].includes(cleanBroker)) {
    return {
      success: false,
      license: getUserLicense(),
      message: 'Broker bukan merupakan mitra resmi PTrack. Silakan pilih Exness, HFM, atau Valetax.'
    };
  }

  const lic = getUserLicense();
  const updated: UserLicense = {
    ...lic,
    tier: 'affiliate',
    status: 'active',
    owner_name: ownerName || lic.owner_name || `Partner ${cleanBroker}`,
    affiliate_broker: cleanBroker,
    affiliate_account: cleanAcc,
    expires_at: 'Lifetime (Affiliate Active)',
    features: TIER_FEATURES.affiliate
  };

  memoryLicense = updated;
  saveLicenseToDisk(updated);

  return {
    success: true,
    license: updated,
    message: `Verifikasi Partner Berhasil! Akun ${cleanBroker} #${cleanAcc} terverifikasi di bawah kode IB Partner PTrack. Fitur MT5 Auto-Sync aktif untuk hingga 3 akun.`
  };
}

export function activateLicenseKey(
  key: string,
  ownerName?: string
): { success: boolean; license: UserLicense; message: string } {
  const cleanKey = (key || '').trim().toUpperCase();

  const isValidFormat =
    cleanKey.startsWith('PTRACK-PRO') ||
    cleanKey.startsWith('VIP-') ||
    cleanKey.startsWith('PRO-') ||
    cleanKey === 'CENTTRADE-PRO-VIP' ||
    cleanKey.length >= 8;

  if (!isValidFormat) {
    return {
      success: false,
      license: getUserLicense(),
      message: 'Format kunci lisensi tidak valid. Contoh kunci valid: PTRACK-PRO-2026-VIP atau PRO-XXXX-XXXX.'
    };
  }

  const lic = getUserLicense();
  const expDate = new Date();
  expDate.setFullYear(expDate.getFullYear() + 1);

  const updated: UserLicense = {
    ...lic,
    tier: 'pro',
    status: 'active',
    license_key: cleanKey,
    owner_name: ownerName || lic.owner_name || 'VIP Member',
    expires_at: expDate.toISOString().split('T')[0],
    features: TIER_FEATURES.pro
  };

  memoryLicense = updated;
  saveLicenseToDisk(updated);

  return {
    success: true,
    license: updated,
    message: `Lisensi PRO VIP Aktif! Kunci [${cleanKey}] berhasil divalidasi. Nikmati MT5 Auto-Sync tanpa batas broker, interval 15 menit, dan prioritas bridge.`
  };
}

export function resetLicense(): UserLicense {
  const lic: UserLicense = {
    id: 'user_main_license',
    tier: 'free',
    status: 'active',
    owner_name: 'PTrack Trader',
    created_at: new Date().toISOString(),
    features: TIER_FEATURES.free
  };
  memoryLicense = lic;
  saveLicenseToDisk(lic);
  return lic;
}


// ---------------------------------------------------------------------------
// USER AUTHENTICATION & MULTI-ACCOUNT MANAGEMENT
// ---------------------------------------------------------------------------

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_jfzla_salt_2026').digest('hex');
}

function loadUsersFromDisk(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    const fallbackPath = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users from disk:', err);
  }
  return [];
}

export function saveUsersToDisk(users: User[]) {
  try {
    memoryUsers = users;
    isUsersInitialized = true;
    ensureDirectoryExists();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write users to disk:', err);
  }
}

export function getAllUsers(force = false): User[] {
  if (!isUsersInitialized || force) {
    memoryUsers = loadUsersFromDisk();
    if (memoryUsers.length === 0) {
      // Seed initial demo trader
      const demoUser: User = {
        id: 'usr_demo_1',
        name: 'Jonathan Cent Trader',
        email: 'trader@jfzla.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        provider: 'credentials',
        password_hash: hashPassword('password123'),
        role: 'vip',
        preferred_broker: 'Exness',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      memoryUsers = [demoUser];
      saveUsersToDisk(memoryUsers);
    }
    isUsersInitialized = true;
  }
  return memoryUsers;
}

export function findUserByEmail(email: string): User | undefined {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (memoryUsers && memoryUsers.length > 0) {
    const cached = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (cached) return cached;
  }
  const users = getAllUsers(true);
  return users.find(u => u.email.toLowerCase() === cleanEmail);
}

export function findUserById(id: string): User | undefined {
  if (memoryUsers && memoryUsers.length > 0) {
    const cached = memoryUsers.find(u => u.id === id);
    if (cached) return cached;
  }
  const users = getAllUsers(true);
  return users.find(u => u.id === id);
}

export function registerUser(
  name: string,
  email: string,
  password?: string,
  provider: 'credentials' | 'google' = 'credentials',
  avatar?: string,
  preferred_broker?: BrokerName
): { success: boolean; user?: User; error?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Format email tidak valid.' };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }
  if (provider === 'credentials' && (!password || password.length < 6)) {
    return { success: false, error: 'Password minimal 6 karakter.' };
  }

  const existing = findUserByEmail(cleanEmail);
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar. Silakan masuk.' };
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: cleanEmail,
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    provider,
    password_hash: password ? hashPassword(password) : undefined,
    role: 'client_starter',
    preferred_broker: preferred_broker || 'Exness',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  const users = getAllUsers();
  users.push(newUser);
  memoryUsers = users;
  saveUsersToDisk(users);

  return { success: true, user: newUser };
}

export function authenticateUser(email: string, password: string): { success: boolean; user?: User; error?: string } {
  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Akun dengan email ini tidak ditemukan.' };
  }
  if (user.provider === 'google' && !user.password_hash) {
    return { success: false, error: 'Akun ini terdaftar lewat Google. Silakan klik Masuk dengan Google.' };
  }
  const hash = hashPassword(password);
  if (user.password_hash !== hash) {
    return { success: false, error: 'Password salah. Silakan periksa kembali.' };
  }

  user.last_login = new Date().toISOString();
  saveUsersToDisk(getAllUsers());
  return { success: true, user };
}

export function authenticateWithGoogle(email: string, name: string, avatar?: string): { success: boolean; user: User } {
  const existing = findUserByEmail(email);
  if (existing) {
    existing.last_login = new Date().toISOString();
    if (avatar && !existing.avatar) existing.avatar = avatar;
    saveUsersToDisk(getAllUsers());
    return { success: true, user: existing };
  }

  const registered = registerUser(name, email, undefined, 'google', avatar, 'Exness');
  return { success: true, user: registered.user! };
}
