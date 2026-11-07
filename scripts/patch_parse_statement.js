const fs = require('fs');

let c = fs.readFileSync('src/lib/db.ts', 'utf8');

c = c.replace(
  "export function parseStatement(content: string, defaultStrategy = 'Imported Statement'): Trade[] {",
  "export function parseStatement(content: string, defaultStrategy = 'Imported Statement', userId?: string, accountId?: string): Trade[] {"
);

// In parseStatement, find user's account if accountId not provided
c = c.replace(
  "const trades: Trade[] = [];",
  `const trades: Trade[] = [];
  initAccountsDB();
  const effectiveAccountId = accountId || (userId ? memoryAccounts.find(a => a.user_id === userId)?.id : undefined) || 'acc_exness_1';`
);

c = c.replaceAll(
  "account_id: 'acc_exness_1',",
  "account_id: effectiveAccountId,\n            user_id: userId,"
);

fs.writeFileSync('src/lib/db.ts', c, 'utf8');
console.log('Updated parseStatement with userId & effectiveAccountId');
