const fs = require('fs');

let c = fs.readFileSync('src/lib/types.ts', 'utf8');

// 1. UserRole and User
c = c.replace(
  "export type Language = 'en' | 'id';",
  `export type Language = 'en' | 'id';\n\nexport type UserRole =\n  | 'admin'\n  | 'client_starter'\n  | 'client_affiliate'\n  | 'client_pro'\n  | 'trader'\n  | 'vip';`
);

c = c.replace(
  "  role: 'trader' | 'vip' | 'admin';",
  "  role: UserRole;"
);

// 2. BrokerAccount user_id
c = c.replace(
  "export interface BrokerAccount {\n  id: string;",
  "export interface BrokerAccount {\n  id: string;\n  user_id?: string;"
);
c = c.replace(
  "export interface BrokerAccount {\r\n  id: string;",
  "export interface BrokerAccount {\r\n  id: string;\r\n  user_id?: string;"
);

// 3. Trade user_id
c = c.replace(
  "export interface Trade {\n  id: number;",
  "export interface Trade {\n  id: number;\n  user_id?: string;"
);
c = c.replace(
  "export interface Trade {\r\n  id: number;",
  "export interface Trade {\r\n  id: number;\r\n  user_id?: string;"
);

// 4. TradingPlan user_id
c = c.replace(
  "export interface TradingPlan {\n  id: string;",
  "export interface TradingPlan {\n  id: string;\n  user_id?: string;"
);
c = c.replace(
  "export interface TradingPlan {\r\n  id: string;",
  "export interface TradingPlan {\r\n  id: string;\r\n  user_id?: string;"
);

// 5. UserLicense user_id
c = c.replace(
  "export interface UserLicense {\n  id: string;",
  "export interface UserLicense {\n  id: string;\n  user_id?: string;"
);
c = c.replace(
  "export interface UserLicense {\r\n  id: string;",
  "export interface UserLicense {\r\n  id: string;\r\n  user_id?: string;"
);

// 6. RBAC Helper functions at the bottom
const rbacHelpers = `

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
`;

c += rbacHelpers;

fs.writeFileSync('src/lib/types.ts', c, 'utf8');
console.log('Successfully updated src/lib/types.ts with RBAC types');
