const fs = require('fs');

// 1. Update src/lib/db.ts
let dbCode = fs.readFileSync('src/lib/db.ts', 'utf8');
const isDbCRLF = dbCode.includes('\r\n');
if (isDbCRLF) dbCode = dbCode.replace(/\r\n/g, '\n');

// Update addTrade to handle is_reviewed
const oldAddTradeCode = `  if (tradeData.ticket) {
    const existingIdx = memoryTrades.findIndex(t => t.ticket === tradeData.ticket);
    if (existingIdx !== -1) {
      memoryTrades[existingIdx] = { ...memoryTrades[existingIdx], ...tradeData } as Trade;
      saveTradesToDisk(memoryTrades);
      return memoryTrades[existingIdx];
    }
  }

  const newId = memoryTrades.length > 0 ? Math.max(...memoryTrades.map(t => t.id)) + 1 : 1;
  const newTrade: Trade = {
    id: newId,
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
    screenshot_url: tradeData.screenshot_url
  };`;

const newAddTradeCode = `  if (tradeData.ticket) {
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
  };`;

if (dbCode.includes(oldAddTradeCode)) {
  dbCode = dbCode.replace(oldAddTradeCode, newAddTradeCode);
  console.log('Updated addTrade in db.ts with is_reviewed preservation');
} else {
  console.log('oldAddTradeCode not matched in db.ts');
}

// Update updateTradeReview to set is_reviewed: true and reviewed_at
const oldUpdateTradeReview = `export function updateTradeReview(
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
    notes: review.notes !== null ? review.notes : memoryTrades[idx].notes
  };

  saveTradesToDisk(memoryTrades);
  return memoryTrades[idx];
}`;

const newUpdateTradeReview = `export function updateTradeReview(
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
}`;

if (dbCode.includes(oldUpdateTradeReview)) {
  dbCode = dbCode.replace(oldUpdateTradeReview, newUpdateTradeReview);
  console.log('Updated updateTradeReview with is_reviewed: true');
} else {
  console.log('oldUpdateTradeReview not matched in db.ts');
}

if (isDbCRLF) dbCode = dbCode.replace(/\n/g, '\r\n');
fs.writeFileSync('src/lib/db.ts', dbCode, 'utf8');

// 2. Update src/components/AppShell.tsx
let appShell = fs.readFileSync('src/components/AppShell.tsx', 'utf8');
const isShellCRLF = appShell.includes('\r\n');
if (isShellCRLF) appShell = appShell.replace(/\r\n/g, '\n');

// Populate reviewForm when activeReviewTrade changes
const oldReviewFormState = `  const [reviewForm, setReviewForm] = useState({
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None',
    mae: '',
    mfe: '',
    notes: '',
  });`;

const newReviewFormState = `  const [reviewForm, setReviewForm] = useState({
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None',
    mae: '',
    mfe: '',
    notes: '',
  });

  // Keep reviewForm in sync with activeReviewTrade
  useEffect(() => {
    if (activeReviewTrade) {
      setReviewForm({
        rule_followed: activeReviewTrade.rule_followed !== undefined ? activeReviewTrade.rule_followed : true,
        psychology_state: activeReviewTrade.psychology_state || 'Disciplined',
        mistake_tag: activeReviewTrade.mistake_tag || 'None',
        mae: activeReviewTrade.mae !== undefined ? String(activeReviewTrade.mae) : '',
        mfe: activeReviewTrade.mfe !== undefined ? String(activeReviewTrade.mfe) : '',
        notes: activeReviewTrade.notes || '',
      });
    }
  }, [activeReviewTrade]);`;

if (appShell.includes(oldReviewFormState)) {
  appShell = appShell.replace(oldReviewFormState, newReviewFormState);
  console.log('Updated reviewForm sync in AppShell.tsx');
} else {
  console.log('oldReviewFormState not matched in AppShell.tsx');
}

if (isShellCRLF) appShell = appShell.replace(/\n/g, '\r\n');
fs.writeFileSync('src/components/AppShell.tsx', appShell, 'utf8');

console.log('Patches complete!');
