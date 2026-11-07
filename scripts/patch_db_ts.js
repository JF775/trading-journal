const fs = require('fs');

let c = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Update getAllAccounts to accept userId
const oldGetAllAccounts = `export function getAllAccounts(): BrokerAccount[] {
  initAccountsDB();
  initDB();
  return memoryAccounts.map(acc => ({
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  }));
}`;

const newGetAllAccounts = `export function getAllAccounts(userId?: string): BrokerAccount[] {
  initAccountsDB();
  initDB();
  let accounts = [...memoryAccounts];
  if (userId) {
    const user = findUserById(userId);
    // If not admin, strictly return only this user's accounts
    if (user && user.role !== 'admin') {
      accounts = accounts.filter(acc => acc.user_id === userId);
    }
  }
  return accounts.map(acc => ({
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  }));
}`;

c = c.replace(oldGetAllAccounts, newGetAllAccounts);

// 2. Update getAccountById to accept userId
const oldGetAccountById = `export function getAccountById(id: string): BrokerAccount | undefined {
  initAccountsDB();
  initDB();
  const acc = memoryAccounts.find(a => a.id === id);
  if (!acc) return undefined;
  return {
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  };
}`;

const newGetAccountById = `export function getAccountById(id: string, userId?: string): BrokerAccount | undefined {
  initAccountsDB();
  initDB();
  const acc = memoryAccounts.find(a => a.id === id);
  if (!acc) return undefined;
  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin' && acc.user_id && acc.user_id !== userId) {
      return undefined; // unauthorized access to another user's account
    }
  }
  return {
    ...acc,
    trades_count: memoryTrades.filter(t => t.account_id === acc.id).length
  };
}`;

c = c.replace(oldGetAccountById, newGetAccountById);

// 3. Update addAccount to accept userId and enforce RBAC rules
const oldAddAccount = `export function addAccount(data: Partial<BrokerAccount>): BrokerAccount {
  initAccountsDB();
  const id = \`acc_\${(data.broker || 'broker').toLowerCase()}_\${Date.now()}\`;
  const newAccount: BrokerAccount = {
    id,
    name: data.name || \`\${data.broker || 'Broker'} Account #\${data.login || 'New'}\`,
    broker: (data.broker || 'Exness') as BrokerName,
    server: data.server || 'Exness-MT5Real9',
    login: String(data.login || '1000000'),
    investor_password: data.investor_password ? String(data.investor_password) : undefined,
    account_type: data.account_type || 'cent',
    currency: data.currency || (data.account_type === 'standard' ? 'USD' : 'USC'),
    leverage: Number(data.leverage) || 2000,
    balance: Number(data.balance) || 100000,
    equity: Number(data.equity || data.balance) || 100000,
    floating_pnl: Number(data.floating_pnl) || 0,
    status: data.status || 'connected',
    sync_mode: data.sync_mode || 'local',
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  memoryAccounts.unshift(newAccount);
  saveAccountsToDisk(memoryAccounts);
  return newAccount;
}`;

const newAddAccount = `export function addAccount(data: Partial<BrokerAccount>, userId?: string): BrokerAccount {
  initAccountsDB();

  // Enforce RBAC Package Restrictions
  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin') {
      const userAccounts = memoryAccounts.filter(a => a.user_id === userId);
      
      // Starter: max 1 account
      if (user.role === 'client_starter' || user.role === 'trader') {
        if (userAccounts.length >= 1) {
          throw new Error('Batas paket Starter tercapai (Maksimal 1 Akun Trading MT5). Tautkan akun broker mitra resmi kami untuk klaim paket Affiliate atau upgrade ke VIP PRO.');
        }
      }

      // Affiliate: max 3 accounts & only official partner brokers
      if (user.role === 'client_affiliate') {
        if (userAccounts.length >= 3) {
          throw new Error('Batas paket Partner Affiliate tercapai (Maksimal 3 Akun Trading MT5). Upgrade ke paket VIP PRO untuk akun tanpa batas.');
        }
        const partnerBrokers: BrokerName[] = ['Exness', 'HFM', 'Valetax'];
        if (data.broker && !partnerBrokers.includes(data.broker as BrokerName)) {
          throw new Error('Paket Partner Affiliate hanya mendukung broker mitra resmi: Exness, HFM, atau Valetax.');
        }
      }
    }
  }

  const id = \`acc_\${(data.broker || 'broker').toLowerCase()}_\${Date.now()}\`;
  const newAccount: BrokerAccount = {
    id,
    user_id: userId,
    name: data.name || \`\${data.broker || 'Broker'} Account #\${data.login || 'New'}\`,
    broker: (data.broker || 'Exness') as BrokerName,
    server: data.server || 'Exness-MT5Real9',
    login: String(data.login || '1000000'),
    investor_password: data.investor_password ? String(data.investor_password) : undefined,
    account_type: data.account_type || 'cent',
    currency: data.currency || (data.account_type === 'standard' ? 'USD' : 'USC'),
    leverage: Number(data.leverage) || 2000,
    balance: Number(data.balance) || 100000,
    equity: Number(data.equity || data.balance) || 100000,
    floating_pnl: Number(data.floating_pnl) || 0,
    status: data.status || 'connected',
    sync_mode: data.sync_mode || 'local',
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  memoryAccounts.unshift(newAccount);
  saveAccountsToDisk(memoryAccounts);
  return newAccount;
}`;

c = c.replace(oldAddAccount, newAddAccount);

// 4. Update deleteAccount to check userId
const oldDeleteAccount = `export function deleteAccount(id: string): boolean {
  initAccountsDB();
  const initialLength = memoryAccounts.length;
  memoryAccounts = memoryAccounts.filter(a => a.id !== id);
  if (memoryAccounts.length !== initialLength) {
    saveAccountsToDisk(memoryAccounts);
    return true;
  }
  return false;
}`;

const newDeleteAccount = `export function deleteAccount(id: string, userId?: string): boolean {
  initAccountsDB();
  const acc = memoryAccounts.find(a => a.id === id);
  if (!acc) return false;
  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin' && acc.user_id && acc.user_id !== userId) {
      return false; // Not allowed to delete another user's account
    }
  }
  memoryAccounts = memoryAccounts.filter(a => a.id !== id);
  saveAccountsToDisk(memoryAccounts);
  return true;
}`;

c = c.replace(oldDeleteAccount, newDeleteAccount);

// 5. Update getAllTrades to filter by userId
const oldGetAllTrades = `export function getAllTrades(filters?: {
  symbol?: string;
  order_type?: string;
  strategy?: string;
  date?: string;
  account_id?: string;
}): Trade[] {
  initDB();
  let trades = [...memoryTrades];

  if (filters?.account_id && filters.account_id !== 'all') {
    trades = trades.filter(t => t.account_id === filters.account_id);
  }
  if (filters?.symbol && filters.symbol !== 'all') {
    trades = trades.filter(t => t.symbol === filters.symbol);
  }
  if (filters?.order_type && filters.order_type !== 'all') {
    trades = trades.filter(t => t.order_type === filters.order_type);
  }
  if (filters?.strategy && filters.strategy !== 'all') {
    trades = trades.filter(t => t.strategy === filters.strategy);
  }
  if (filters?.date) {
    trades = trades.filter(t => t.close_time.startsWith(filters.date!));
  }

  return trades;
}`;

const newGetAllTrades = `export function getAllTrades(filters?: {
  symbol?: string;
  order_type?: string;
  strategy?: string;
  date?: string;
  account_id?: string;
  userId?: string;
}): Trade[] {
  initDB();
  initAccountsDB();
  let trades = [...memoryTrades];

  if (filters?.userId) {
    const user = findUserById(filters.userId);
    if (user && user.role !== 'admin') {
      const userAccs = memoryAccounts.filter(a => a.user_id === filters.userId);
      const userAccIds = new Set(userAccs.map(a => a.id));
      trades = trades.filter(t => t.user_id === filters.userId || (t.account_id && userAccIds.has(t.account_id)));
    }
  }

  if (filters?.account_id && filters.account_id !== 'all') {
    trades = trades.filter(t => t.account_id === filters.account_id);
  }
  if (filters?.symbol && filters.symbol !== 'all') {
    trades = trades.filter(t => t.symbol === filters.symbol);
  }
  if (filters?.order_type && filters.order_type !== 'all') {
    trades = trades.filter(t => t.order_type === filters.order_type);
  }
  if (filters?.strategy && filters.strategy !== 'all') {
    trades = trades.filter(t => t.strategy === filters.strategy);
  }
  if (filters?.date) {
    trades = trades.filter(t => t.close_time.startsWith(filters.date!));
  }

  return trades;
}`;

c = c.replace(oldGetAllTrades, newGetAllTrades);

// 6. Update addTrade to accept userId
const oldAddTrade = `export function addTrade(data: Partial<Trade>): Trade {
  initDB();
  const id = memoryTrades.length > 0 ? Math.max(...memoryTrades.map(t => t.id)) + 1 : 1;
  const newTrade: Trade = {
    id,
    ticket: data.ticket || \`TK\${Date.now().toString().slice(-6)}\`,
    account_id: data.account_id || 'acc_exness_1',
    symbol: data.symbol || 'EURUSD',
    order_type: data.order_type || 'BUY',
    lots: data.lots || 0.1,
    open_price: data.open_price || 1.08500,
    close_price: data.close_price || 1.08700,
    open_time: data.open_time || new Date(Date.now() - 3600000).toISOString(),
    close_time: data.close_time || new Date().toISOString(),
    profit: data.profit || 20.0,
    commission: data.commission || 0,
    swap: data.swap || 0,
    strategy: data.strategy || 'Cent EA Grid',
    session: data.session || 'London',
    rule_followed: data.rule_followed ?? true,
    psychology_state: data.psychology_state || 'Disciplined',
    mistake_tag: data.mistake_tag || 'None',
    mae: data.mae,
    mfe: data.mfe,
    notes: data.notes
  };

  memoryTrades.unshift(newTrade);
  saveTradesToDisk(memoryTrades);
  return newTrade;
}`;

const newAddTrade = `export function addTrade(data: Partial<Trade>, userId?: string): Trade {
  initDB();
  const id = memoryTrades.length > 0 ? Math.max(...memoryTrades.map(t => t.id)) + 1 : 1;
  const newTrade: Trade = {
    id,
    user_id: userId,
    ticket: data.ticket || \`TK\${Date.now().toString().slice(-6)}\`,
    account_id: data.account_id || 'acc_exness_1',
    symbol: data.symbol || 'EURUSD',
    order_type: data.order_type || 'BUY',
    lots: data.lots || 0.1,
    open_price: data.open_price || 1.08500,
    close_price: data.close_price || 1.08700,
    open_time: data.open_time || new Date(Date.now() - 3600000).toISOString(),
    close_time: data.close_time || new Date().toISOString(),
    profit: data.profit || 20.0,
    commission: data.commission || 0,
    swap: data.swap || 0,
    strategy: data.strategy || 'Cent EA Grid',
    session: data.session || 'London',
    rule_followed: data.rule_followed ?? true,
    psychology_state: data.psychology_state || 'Disciplined',
    mistake_tag: data.mistake_tag || 'None',
    mae: data.mae,
    mfe: data.mfe,
    notes: data.notes
  };

  memoryTrades.unshift(newTrade);
  saveTradesToDisk(memoryTrades);
  return newTrade;
}`;

c = c.replace(oldAddTrade, newAddTrade);

// 7. Update calculateAnalytics to accept userId
const oldCalculateAnalytics = `export function calculateAnalytics(accountId?: string): AnalyticsSummary {
  initDB();
  initAccountsDB();

  let validTrades = [...memoryTrades];
  if (memoryAccounts.length > 0) {
    const validAccountIds = new Set(memoryAccounts.map(a => a.id));
    validTrades = validTrades.filter(t => t.account_id ? validAccountIds.has(t.account_id) : false);
  }

  const sourceTrades = (accountId && accountId !== 'all')
    ? validTrades.filter(t => t.account_id === accountId)
    : validTrades;`;

const newCalculateAnalytics = `export function calculateAnalytics(accountId?: string, userId?: string): AnalyticsSummary {
  initDB();
  initAccountsDB();

  let validTrades = [...memoryTrades];

  if (userId) {
    const user = findUserById(userId);
    if (user && user.role !== 'admin') {
      const userAccounts = memoryAccounts.filter(a => a.user_id === userId);
      const userAccIds = new Set(userAccounts.map(a => a.id));
      validTrades = validTrades.filter(t => t.user_id === userId || (t.account_id && userAccIds.has(t.account_id)));
    }
  } else if (memoryAccounts.length > 0) {
    const validAccountIds = new Set(memoryAccounts.map(a => a.id));
    validTrades = validTrades.filter(t => t.account_id ? validAccountIds.has(t.account_id) : false);
  }

  const sourceTrades = (accountId && accountId !== 'all')
    ? validTrades.filter(t => t.account_id === accountId)
    : validTrades;`;

c = c.replace(oldCalculateAnalytics, newCalculateAnalytics);

// 8. Update getUserLicense to accept userId
const oldGetUserLicense = `export function getUserLicense(): UserLicense {
  if (!memoryLicense) {
    memoryLicense = loadLicenseFromDisk();
  }
  return memoryLicense;
}`;

const newGetUserLicense = `export function getUserLicense(userId?: string): UserLicense {
  if (userId) {
    const user = findUserById(userId);
    if (user) {
      const role = user.role;
      const isPro = role === 'admin' || role === 'client_pro' || role === 'vip';
      const isAffiliate = role === 'client_affiliate';
      
      const tier: LicenseTier = isPro ? 'pro' : isAffiliate ? 'affiliate' : 'free';
      const maxAccounts = isPro ? 999 : isAffiliate ? 3 : 1;
      const autoSync = isPro || isAffiliate;
      const allowedBrokers: BrokerName[] | 'all' = isAffiliate ? ['Exness', 'HFM', 'Valetax'] : 'all';
      const syncInterval = isPro ? 5 : isAffiliate ? 60 : 0;

      return {
        id: \`lic_\${user.id}\`,
        user_id: user.id,
        tier,
        status: 'active',
        license_key: isPro ? \`JFZLA-PRO-\${user.id.slice(-6).toUpperCase()}\` : isAffiliate ? \`JFZLA-AFF-\${user.id.slice(-6).toUpperCase()}\` : undefined,
        owner_name: user.name,
        affiliate_broker: user.preferred_broker || 'Exness',
        affiliate_account: user.id,
        expires_at: isPro ? '2028-12-31' : 'Selamanya (Active Partner)',
        created_at: user.created_at,
        features: {
          max_mt5_accounts: maxAccounts,
          auto_sync_enabled: autoSync,
          allowed_brokers: allowedBrokers,
          sync_interval_minutes: syncInterval,
          export_enabled: isPro,
          priority_bridge: isPro
        }
      };
    }
  }

  if (!memoryLicense) {
    memoryLicense = loadLicenseFromDisk();
  }
  return memoryLicense;
}`;

c = c.replace(oldGetUserLicense, newGetUserLicense);

fs.writeFileSync('src/lib/db.ts', c, 'utf8');
console.log('Successfully patched src/lib/db.ts with per-user isolation & RBAC!');
