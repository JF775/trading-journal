const fs = require('fs');

let c = fs.readFileSync('src/lib/db.ts', 'utf8');

const oldSyncAllDecl = `export async function syncAllAccounts(force = false): Promise<SyncAllResult> {
  initAccountsDB();
  const lic = getUserLicense();

  if (!lic.features.auto_sync_enabled) {
    return {
      success: false,
      total_accounts: memoryAccounts.length,
      synced_accounts: 0,
      skipped_accounts: 0,
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

  for (const acc of memoryAccounts) {`;

const newSyncAllDecl = `export async function syncAllAccounts(force = false, userId?: string): Promise<SyncAllResult> {
  initAccountsDB();
  const user = userId ? findUserById(userId) : undefined;
  const lic = getUserLicense(userId);

  if (!lic.features.auto_sync_enabled && (!user || user.role !== 'admin')) {
    return {
      success: false,
      total_accounts: 0,
      synced_accounts: 0,
      skipped_accounts: 0,
      failed_accounts: 0,
      new_trades_total: 0,
      details: [],
      message: 'Fitur Auto-Sync MT5 memerlukan paket Affiliate atau VIP PRO. Akun Starter Gratis hanya dapat menggunakan pencatatan manual.'
    };
  }

  let targetAccounts = [...memoryAccounts];
  if (user && user.role !== 'admin') {
    targetAccounts = targetAccounts.filter(a => a.user_id === userId);
  }

  const details: SyncAccountDetail[] = [];
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  let totalNewTrades = 0;

  const minIntervalMs = (lic.features.sync_interval_minutes || 15) * 60 * 1000;
  const now = Date.now();

  for (const acc of targetAccounts) {`;

c = c.replace(oldSyncAllDecl, newSyncAllDecl);

fs.writeFileSync('src/lib/db.ts', c, 'utf8');
console.log('Successfully updated syncAllAccounts with userId in src/lib/db.ts');
