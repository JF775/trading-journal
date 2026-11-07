const fs = require('fs');

let c = fs.readFileSync('src/lib/db.ts', 'utf8');

// Let's inspect where getAllAccounts is defined
console.log('Includes getAllAccounts:', c.includes('export function getAllAccounts'));
console.log('Includes calculateAnalytics:', c.includes('export function calculateAnalytics'));
console.log('Includes getUserLicense:', c.includes('export function getUserLicense'));
console.log('Includes getAllTrades:', c.includes('export function getAllTrades'));
console.log('Includes getAllUsers:', c.includes('export function getAllUsers'));
