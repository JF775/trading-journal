import { NextRequest, NextResponse } from 'next/server';
import { addTrade, getAllTrades, syncAccountFromWebhook } from '@/lib/db';
import { Trade } from '@/lib/types';

// Health check and connection verification endpoint for MT5
export async function GET() {
  const existingCount = getAllTrades().length;
  return NextResponse.json({
    status: 'online',
    service: 'CentTrade MT5 AutoSync Gateway',
    version: '2.1.0',
    mode: 'Cloud-Native Push & Webhook',
    total_trades_stored: existingCount,
    server_time: new Date().toISOString(),
    allowed_methods: ['GET', 'POST'],
  });
}

// Ingest deals or live equity heartbeats from MT5 WebHook (Single deal, Batch deals, or Heartbeat)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Process Account Metadata / Heartbeat if present
    let matchedAccount = null;
    const loginField = body.account_login || body.login;
    if (loginField) {
      matchedAccount = syncAccountFromWebhook({
        account_login: loginField,
        account_server: body.account_server || body.server,
        account_balance: body.account_balance !== undefined ? Number(body.account_balance) : body.balance,
        account_equity: body.account_equity !== undefined ? Number(body.account_equity) : body.equity,
        account_floating: body.account_floating !== undefined ? Number(body.account_floating) : body.floating,
        account_currency: body.account_currency || body.currency,
        account_leverage: body.account_leverage || body.leverage,
        account_company: body.account_company || body.company
      });
    }

    // If it's purely a periodic equity heartbeat without closed deals
    if (body.is_heartbeat) {
      return NextResponse.json({
        success: true,
        message: 'Account heartbeat and live equity recorded successfully',
        account: matchedAccount
      }, { status: 200 });
    }

    // 2. Identify deals to ingest
    let dealsToProcess: any[] = [];
    if (Array.isArray(body)) {
      dealsToProcess = body;
    } else if (body && Array.isArray(body.deals)) {
      dealsToProcess = body.deals;
    } else if (body && typeof body === 'object' && (body.ticket || body.symbol)) {
      dealsToProcess = [body];
    }

    // If no deals and no heartbeat, return 400
    if (dealsToProcess.length === 0 && !matchedAccount) {
      return NextResponse.json({ error: 'No deals or account data provided' }, { status: 400 });
    }

    const processed: Trade[] = [];
    for (const deal of dealsToProcess) {
      // Map and link to account if available
      const accountId = matchedAccount?.id || (deal.account_id ? String(deal.account_id) : undefined);

      const tradePayload: Partial<Trade> = {
        ticket: deal.ticket ? String(deal.ticket) : undefined,
        account_id: accountId,
        symbol: (deal.symbol || 'XAUUSD').toUpperCase(),
        order_type: (deal.order_type || 'BUY').toUpperCase() as 'BUY' | 'SELL',
        lots: Number(deal.lots || 0.01),
        open_price: Number(deal.open_price || 0),
        close_price: Number(deal.close_price || deal.open_price || 0),
        open_time: deal.open_time || deal.close_time || new Date().toISOString(),
        close_time: deal.close_time || new Date().toISOString(),
        profit: Number(deal.profit || 0),
        commission: Number(deal.commission || 0),
        swap: Number(deal.swap || 0),
        strategy: deal.strategy || matchedAccount?.name || 'MT5 AutoSync',
        notes: deal.notes || `Auto-synced from MT5 ticket #${deal.ticket || 'unknown'}`,
        rule_followed: true,
        psychology_state: 'Disciplined',
        mistake_tag: 'None',
      };

      const saved = addTrade(tradePayload);
      processed.push(saved);
    }

    return NextResponse.json({
      success: true,
      synced_count: processed.length,
      synced_tickets: processed.map(t => t.ticket),
      account: matchedAccount ? {
        id: matchedAccount.id,
        login: matchedAccount.login,
        balance: matchedAccount.balance,
        equity: matchedAccount.equity,
        floating_pnl: matchedAccount.floating_pnl
      } : null,
      message: `Successfully processed ${processed.length} deal(s) and synced account metrics`,
    }, { status: 200 });

  } catch (error) {
    console.error('MT5 sync error:', error);
    return NextResponse.json({ error: 'Failed to process MT5 sync payload' }, { status: 500 });
  }
}
