/**
 * CentTrade PRO - MT5 Sync CLI & Statement Watcher
 * ------------------------------------------------
 * Usage:
 *   node scripts/mt5-sync.mjs                   (Ping API & check health)
 *   node scripts/mt5-sync.mjs <file.html|csv>   (Sync specific MT5 statement)
 *   node scripts/mt5-sync.mjs --watch <dir>     (Auto-sync statements dropped in directory)
 */

import fs from 'node:fs';
import path from 'node:path';

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const SYNC_URL = `${API_BASE}/api/sync/mt5`;
const IMPORT_URL = `${API_BASE}/api/import/statement`;

async function checkHealth() {
  try {
    const res = await fetch(SYNC_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('[OK] CentTrade MT5 Sync Gateway is online:');
    console.log(`     Target: ${SYNC_URL}`);
    console.log(`     Server Time: ${data.server_time}`);
    console.log(`     Stored Trades: ${data.total_trades_stored}`);
    return true;
  } catch (err) {
    console.error(`[ERR] Cannot reach ${SYNC_URL}:`, err.message);
    console.log('     Make sure Next.js is running (`npm run dev`)');
    return false;
  }
}

async function uploadStatement(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERR] File not found: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`[SYNC] Uploading statement: ${path.basename(filePath)} (${content.length} bytes)...`);

  try {
    const res = await fetch(IMPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement_content: content, strategy: 'MT5 Statement Import' })
    });
    const result = await res.json();
    if (res.ok) {
      console.log(`[SUCCESS] Imported ${result.imported_count} new trades. (Total: ${result.total_trades})`);
    } else {
      console.error(`[ERR] Import failed:`, result.error || result);
    }
  } catch (err) {
    console.error(`[ERR] Failed to upload statement:`, err.message);
  }
}

async function watchDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`[ERR] Directory does not exist: ${dirPath}`);
    return;
  }
  console.log(`[WATCH] Watching directory for MT5 statements: ${dirPath}`);
  fs.watch(dirPath, (eventType, filename) => {
    if (filename && (filename.endsWith('.html') || filename.endsWith('.csv') || filename.endsWith('.htm'))) {
      const fullPath = path.join(dirPath, filename);
      setTimeout(() => uploadStatement(fullPath), 1000); // 1s buffer for MT5 write completion
    }
  });
}

// CLI Argument Handling
const args = process.argv.slice(2);
if (args.length === 0) {
  checkHealth();
} else if (args[0] === '--watch' && args[1]) {
  watchDir(args[1]);
} else {
  uploadStatement(args[0]);
}
