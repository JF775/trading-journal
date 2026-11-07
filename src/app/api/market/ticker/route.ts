import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface MarketTickerQuote {
  symbol: string;
  name: string;
  price: number;
  change: number; // 24h percentage change (e.g. +0.85)
  change_abs: number;
  formatted_price: string;
  updated_at: string;
  source: string;
}

// In-memory cache for speed and rate-limit mitigation (TTL: 4 seconds)
let cachedQuotes: Record<string, MarketTickerQuote> = {
  'XAU/USD': {
    symbol: 'XAU/USD',
    name: 'Gold',
    price: 4070.59,
    change: -0.43,
    change_abs: -17.68,
    formatted_price: '4,070.59',
    updated_at: new Date().toISOString(),
    source: 'TradingView (OANDA)'
  },
  'EUR/USD': {
    symbol: 'EUR/USD',
    name: 'Euro',
    price: 1.11368,
    change: -0.73,
    change_abs: -0.008,
    formatted_price: '1.1137',
    updated_at: new Date().toISOString(),
    source: 'TradingView (FX)'
  },
  'GBP/USD': {
    symbol: 'GBP/USD',
    name: 'British Pound',
    price: 1.33470,
    change: -0.75,
    change_abs: -0.010,
    formatted_price: '1.3347',
    updated_at: new Date().toISOString(),
    source: 'TradingView (FX)'
  },
  'BTC/USD': {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    price: 76008.0,
    change: 0.21,
    change_abs: 157.4,
    formatted_price: '76,008',
    updated_at: new Date().toISOString(),
    source: 'TradingView (Binance)'
  },
  'USD/JPY': {
    symbol: 'USD/JPY',
    name: 'Japanese Yen',
    price: 158.53,
    change: 0.55,
    change_abs: 0.86,
    formatted_price: '158.53',
    updated_at: new Date().toISOString(),
    source: 'TradingView (FX)'
  }
};

let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 4000; // 4 seconds

function formatPriceString(symbol: string, price: number): string {
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    return Math.round(price).toLocaleString('en-US');
  }
  if (symbol.includes('XAU')) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (symbol.includes('JPY')) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

async function fetchFromTradingView(): Promise<Record<string, MarketTickerQuote>> {
  const now = Date.now();
  if (now - lastFetchTimestamp < CACHE_TTL_MS) {
    return cachedQuotes;
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Content-Type': 'application/json'
    };

    const [cfdRes, fxRes, cryptoRes] = await Promise.all([
      fetch('https://scanner.tradingview.com/cfd/scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbols: { tickers: ['OANDA:XAUUSD'] },
          columns: ['close', 'change', 'change_abs']
        }),
        signal: AbortSignal.timeout(3500)
      }).then(r => r.json()).catch(() => null),

      fetch('https://scanner.tradingview.com/forex/scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbols: { tickers: ['FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY'] },
          columns: ['close', 'change', 'change_abs']
        }),
        signal: AbortSignal.timeout(3500)
      }).then(r => r.json()).catch(() => null),

      fetch('https://scanner.tradingview.com/crypto/scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbols: { tickers: ['BINANCE:BTCUSDT'] },
          columns: ['close', 'change', 'change_abs']
        }),
        signal: AbortSignal.timeout(3500)
      }).then(r => r.json()).catch(() => null)
    ]);

    const timestamp = new Date().toISOString();

    // Parse XAU/USD (Gold)
    if (cfdRes?.data?.[0]?.d) {
      const [close, change, change_abs] = cfdRes.data[0].d;
      cachedQuotes['XAU/USD'] = {
        symbol: 'XAU/USD',
        name: 'Gold',
        price: Number(close),
        change: Math.round(Number(change) * 100) / 100,
        change_abs: Number(change_abs),
        formatted_price: formatPriceString('XAU/USD', Number(close)),
        updated_at: timestamp,
        source: 'TradingView (OANDA)'
      };
    }

    // Parse Forex (EUR/USD, GBP/USD, USD/JPY)
    if (Array.isArray(fxRes?.data)) {
      for (const item of fxRes.data) {
        const [close, change, change_abs] = item.d || [];
        const sym = item.s === 'FX:EURUSD' ? 'EUR/USD' :
                    item.s === 'FX:GBPUSD' ? 'GBP/USD' :
                    item.s === 'FX:USDJPY' ? 'USD/JPY' : item.s;
        
        cachedQuotes[sym] = {
          symbol: sym,
          name: sym === 'EUR/USD' ? 'Euro' : sym === 'GBP/USD' ? 'British Pound' : 'Japanese Yen',
          price: Number(close),
          change: Math.round(Number(change) * 100) / 100,
          change_abs: Number(change_abs),
          formatted_price: formatPriceString(sym, Number(close)),
          updated_at: timestamp,
          source: 'TradingView (FX)'
        };
      }
    }

    // Parse Crypto (BTC/USD)
    if (cryptoRes?.data?.[0]?.d) {
      const [close, change, change_abs] = cryptoRes.data[0].d;
      cachedQuotes['BTC/USD'] = {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        price: Number(close),
        change: Math.round(Number(change) * 100) / 100,
        change_abs: Number(change_abs),
        formatted_price: formatPriceString('BTC/USD', Number(close)),
        updated_at: timestamp,
        source: 'TradingView (Binance)'
      };
    }

    lastFetchTimestamp = now;
  } catch (err) {
    console.warn('TradingView scanner fetch error, serving cache:', err);
  }

  return cachedQuotes;
}

export async function GET() {
  const quotes = await fetchFromTradingView();
  return NextResponse.json(quotes, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
