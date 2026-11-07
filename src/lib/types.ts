export type Language = 'en' | 'id';

export type UserRole =
  | 'admin'
  | 'client_starter'
  | 'client_affiliate'
  | 'client_pro'
  | 'trader'
  | 'vip';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'credentials' | 'google';
  password_hash?: string;
  role: UserRole;
  preferred_broker?: BrokerName;
  created_at: string;
  last_login?: string;
}

export type BrokerName = 'Exness' | 'HFM' | 'Valetax' | 'Other';

export interface BrokerAccount {
  id: string;
  user_id?: string;
  name: string;
  broker: BrokerName;
  server: string;
  login: string;
  investor_password?: string;
  account_type: 'cent' | 'standard';
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  floating_pnl: number;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  sync_mode?: 'local' | 'remote' | 'webhook' | 'demo';
  sync_error?: string;
  last_sync?: string;
  created_at: string;
  trades_count?: number;
}

export const BROKER_PRESETS: Record<BrokerName, string[]> = {
  Exness: [
    'Exness-MT5Real',
    'Exness-MT5Real2',
    'Exness-MT5Real3',
    'Exness-MT5Real4',
    'Exness-MT5Real5',
    'Exness-MT5Real6',
    'Exness-MT5Real7',
    'Exness-MT5Real8',
    'Exness-MT5Real9',
    'Exness-MT5Real10',
    'Exness-MT5Real11',
    'Exness-MT5Real12',
    'Exness-MT5Real14',
    'Exness-MT5Real15',
    'Exness-MT5Real16',
    'Exness-MT5Real18',
    'Exness-MT5Real20',
    'Exness-MT5Real25',
    'Exness-MT5Trial',
    'Exness-MT5Trial2'
  ],
  HFM: [
    'HFMarketsGlobal-Live1',
    'HFMarketsGlobal-Live2',
    'HFMarketsGlobal-Live3',
    'HFMarketsGlobal-Live4',
    'HFMarketsGlobal-Live5',
    'HFMarketsGlobal-Live6',
    'HFMarketsGlobal-Live7',
    'HFMarketsSC-Live1',
    'HFMarketsSC-Live2',
    'HFMarketsSV-Live',
    'HFMarketsSV-Live2',
    'HFMarketsSA-Live',
    'HFMarketsGlobal-Demo'
  ],
  Valetax: [
    'ValetaxIntl-Live',
    'ValetaxIntl-Live2',
    'ValetaxIntl-Live3',
    'ValetaxGlobal-Live',
    'ValetaxIntl-Demo'
  ],
  Other: [
    'Custom-Live',
    'Custom-Demo'
  ]
};

export interface Trade {
  id: number;
  user_id?: string;
  ticket?: string;
  account_id?: string;
  symbol: string;
  order_type: 'BUY' | 'SELL';
  lots: number;
  open_price: number;
  close_price: number;
  open_time?: string;
  close_time: string;
  profit: number;
  commission: number;
  swap: number;
  strategy: string;
  session?: string;
  notes?: string;
  rule_followed: boolean;
  psychology_state: string;
  mistake_tag: string;
  mae?: number;
  mfe?: number;
  screenshot_url?: string;
  is_reviewed?: boolean;
  reviewed_at?: string;
}

export interface DailySummary {
  date: string;
  trades_count: number;
  net_profit: number;
  win_count: number;
  loss_count: number;
}

export interface StrategyPerformance {
  name: string;
  trades_count: number;
  win_rate: number;
  net_profit: number;
  profit_factor: number;
}

export interface AnalyticsSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  net_profit: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number;
  avg_trade: number;
  avg_win: number;
  avg_loss: number;
  max_win: number;
  max_loss: number;
  long_count: number;
  short_count: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  expectancy: number;
  discipline_rate: number;
  top_mistakes: { mistake: string; count: number }[];
  strategy_performance: StrategyPerformance[];
  daily_summaries: DailySummary[];
  equity_curve: {
    timestamp: string;
    date: string;
    profit: number;
    cumulative: number;
    drawdown: number;
    symbol: string;
    lots: number;
  }[];
}

export interface TradingPlan {
  id: string;
  user_id?: string;
  title: string;
  max_daily_loss: number;
  max_risk_per_trade_pct: number;
  max_open_trades: number;
  allowed_sessions: string[];
  setups: string[];
  entry_checklist: { item: string; required: boolean }[];
}

export interface LotCalculationResult {
  balance: number;
  risk_pct: number;
  stop_loss_pips: number;
  symbol: string;
  pip_value: number;
  risk_amount: number;
  recommended_lot: number;
}

export type LicenseTier = 'free' | 'affiliate' | 'pro';

export interface LicenseFeatures {
  max_mt5_accounts: number;
  auto_sync_enabled: boolean;
  allowed_brokers: BrokerName[] | 'all';
  sync_interval_minutes: number;
  export_enabled: boolean;
  priority_bridge: boolean;
}

export interface UserLicense {
  id: string;
  user_id?: string;
  tier: LicenseTier;
  status: 'active' | 'trial' | 'expired';
  license_key?: string;
  owner_name: string;
  affiliate_broker?: BrokerName;
  affiliate_account?: string;
  expires_at?: string;
  created_at: string;
  features: LicenseFeatures;
}

export interface SyncAccountDetail {
  account_id: string;
  name: string;
  login: string;
  broker: BrokerName;
  status: 'synced' | 'skipped' | 'failed';
  new_trades: number;
  error?: string;
}

export interface SyncAllResult {
  success: boolean;
  total_accounts: number;
  synced_accounts: number;
  skipped_accounts: number;
  failed_accounts: number;
  new_trades_total: number;
  details: SyncAccountDetail[];
  message: string;
}


// ---------------------------------------------------------------------------
// RBAC HELPER FUNCTIONS & PACKAGE RULES
// ---------------------------------------------------------------------------

export function isUserAdmin(role?: string): boolean {
  return role === 'admin';
}

export function isUserPro(role?: string): boolean {
  return role === 'client_pro' || role === 'vip' || role === 'admin';
}

export function isUserAffiliate(role?: string): boolean {
  return role === 'client_affiliate' || role === 'client_pro' || role === 'vip' || role === 'admin';
}

export interface RolePackageDetails {
  tier: LicenseTier;
  role: UserRole;
  roleName: string;
  roleBadge: string;
  badgeColor: string;
  maxAccounts: number;
  allowedBrokers: BrokerName[] | 'all';
  autoSyncEnabled: boolean;
  minSyncInterval: number; // in seconds
  canTest: boolean; // Only Admin can perform developer/test simulations
  description: string;
}

export function getRolePackageDetails(role?: string): RolePackageDetails {
  if (role === 'admin') {
    return {
      tier: 'pro',
      role: 'admin',
      roleName: 'Administrator / Developer',
      roleBadge: 'ADMIN',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20',
      maxAccounts: 999,
      allowedBrokers: 'all',
      autoSyncEnabled: true,
      minSyncInterval: 5,
      canTest: true,
      description: 'Akses Penuh Developer & Admin Sistem'
    };
  }

  if (role === 'client_pro' || role === 'vip') {
    return {
      tier: 'pro',
      role: 'client_pro',
      roleName: 'VIP PRO Member',
      roleBadge: 'VIP PRO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20',
      maxAccounts: 999,
      allowedBrokers: 'all',
      autoSyncEnabled: true,
      minSyncInterval: 5,
      canTest: false,
      description: 'Akun MT5 Tanpa Batas, Auto-Sync Cepat 5s, Full Export & Laporan'
    };
  }

  if (role === 'client_affiliate') {
    return {
      tier: 'affiliate',
      role: 'client_affiliate',
      roleName: 'Partner Affiliate',
      roleBadge: 'AFFILIATE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20',
      maxAccounts: 3,
      allowedBrokers: ['Exness', 'HFM', 'Valetax'],
      autoSyncEnabled: true,
      minSyncInterval: 60,
      canTest: false,
      description: 'Maks 3 Akun Partner Broker (Exness, HFM, Valetax) & Auto-Sync Standar'
    };
  }

  // Default: client_starter or trader
  return {
    tier: 'free',
    role: 'client_starter',
    roleName: 'Client Starter (Gratis)',
    roleBadge: 'STARTER',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    maxAccounts: 1,
    allowedBrokers: 'all',
    autoSyncEnabled: false,
    minSyncInterval: 0,
    canTest: false,
    description: 'Maks 1 Akun MT5, Impor Statement Manual, Tanpa Auto-Sync'
  };
}
