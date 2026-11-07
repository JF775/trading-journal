//+------------------------------------------------------------------+
//|                                         TradeJournalWebhook.mq5  |
//|               CentTrade Journal Automated MetaTrader 5 Webhook   |
//|                    Full-Stack Next.js 16 Native Integration      |
//|                    Cloud-Native / Vercel Serverless Ready        |
//+------------------------------------------------------------------+
#property copyright "CentTrade PRO"
#property link      "http://localhost:3000"
#property version   "2.10"
#property description "Auto-syncs closed deals and live equity directly to CentTrade Full-Stack Journal via HTTP WebRequest"
#property script_show_inputs

//--- Inputs
input group "=== CentTrade Webhook Settings ==="
input string InpServerUrl           = "https://trading-journal-jfzla.vercel.app/api/sync/mt5"; // Journal Sync API URL (or Vercel HTTPS)
input string InpStrategyTag         = "Cent Grid EA";                        // Strategy Tag
input bool   InpSyncHistoryOnStart  = true;                                 // Sync Recent History on Attach?
input int    InpSyncDays            = 7;                                    // History Days to Sync
input bool   InpEnableHeartbeat     = true;                                 // Stream Live Equity Heartbeat?
input int    InpHeartbeatInterval   = 60;                                   // Heartbeat Interval in Seconds

//+------------------------------------------------------------------+
//| Helper to send JSON via HTTP WebRequest                          |
//+------------------------------------------------------------------+
bool PostJson(string json_body)
{
   char post_data[];
   StringToCharArray(json_body, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1); // strip null terminator

   string headers = "Content-Type: application/json\r\n";
   char result[];
   string result_headers;

   ResetLastError();
   int res = WebRequest("POST", InpServerUrl, headers, 4000, post_data, result, result_headers);
   
   if(res == 200 || res == 201)
   {
      return true;
   }
   else
   {
      PrintFormat("[CentTrade] [ERROR] WebRequest failed. Code: %d, Err: %d.", res, GetLastError());
      PrintFormat("[CentTrade] Ensure '%s' is allowed in MT5: Tools -> Options -> Expert Advisors -> Allow WebRequest", InpServerUrl);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Send live account heartbeat (Balance, Equity, Floating PnL)      |
//+------------------------------------------------------------------+
void SendAccountHeartbeat()
{
   long   account_login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string account_server   = AccountInfoString(ACCOUNT_SERVER);
   double account_bal      = AccountInfoDouble(ACCOUNT_BALANCE);
   double account_eq       = AccountInfoDouble(ACCOUNT_EQUITY);
   double account_float    = AccountInfoDouble(ACCOUNT_PROFIT);
   long   account_lev      = AccountInfoInteger(ACCOUNT_LEVERAGE);
   string account_curr     = AccountInfoString(ACCOUNT_CURRENCY);
   string account_company  = AccountInfoString(ACCOUNT_COMPANY);

   string json = StringFormat(
      "{\"account_login\":\"%d\",\"account_server\":\"%s\",\"account_balance\":%.2f,"
      "\"account_equity\":%.2f,\"account_floating\":%.2f,\"account_leverage\":%d,"
      "\"account_currency\":\"%s\",\"account_company\":\"%s\",\"is_heartbeat\":true}",
      account_login, account_server, account_bal, account_eq, account_float, account_lev, account_curr, account_company
   );

   if(PostJson(json))
   {
      PrintFormat("[CentTrade] [Heartbeat OK] #%d (%s) Bal: %.2f, Eq: %.2f, Float: %.2f", 
                  account_login, account_server, account_bal, account_eq, account_float);
   }
}

//+------------------------------------------------------------------+
//| Send a single closed deal payload via HTTP WebRequest            |
//+------------------------------------------------------------------+
bool SendTradeWebhook(ulong deal_ticket)
{
   if(!HistoryDealSelect(deal_ticket)) return false;

   long deal_type    = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
   long deal_entry   = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
   
   // Only capture exit deals (closed orders)
   if(deal_entry != DEAL_ENTRY_OUT) return false;

   string symbol     = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
   double volume     = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
   double price      = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
   double profit     = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
   datetime deal_time= (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);

   string type_str   = (deal_type == DEAL_TYPE_BUY) ? "BUY" : "SELL";
   string time_str   = TimeToString(deal_time, TIME_DATE|TIME_SECONDS);
   StringReplace(time_str, ".", "-");

   long   account_login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string account_server   = AccountInfoString(ACCOUNT_SERVER);
   double account_bal      = AccountInfoDouble(ACCOUNT_BALANCE);
   double account_eq       = AccountInfoDouble(ACCOUNT_EQUITY);
   double account_float    = AccountInfoDouble(ACCOUNT_PROFIT);
   long   account_lev      = AccountInfoInteger(ACCOUNT_LEVERAGE);
   string account_curr     = AccountInfoString(ACCOUNT_CURRENCY);

   // Build rich JSON payload with account metadata
   string json = StringFormat(
      "{\"ticket\":\"%I64u\",\"symbol\":\"%s\",\"order_type\":\"%s\",\"lots\":%.2f,"
      "\"open_price\":%.5f,\"close_price\":%.5f,\"close_time\":\"%s\",\"profit\":%.2f,"
      "\"commission\":%.2f,\"swap\":%.2f,\"strategy\":\"%s\","
      "\"account_login\":\"%d\",\"account_server\":\"%s\",\"account_balance\":%.2f,"
      "\"account_equity\":%.2f,\"account_floating\":%.2f,\"account_leverage\":%d,\"account_currency\":\"%s\","
      "\"notes\":\"Real-time auto sync from MT5\"}",
      deal_ticket, symbol, type_str, volume, price, price, time_str, profit, commission, swap, InpStrategyTag,
      account_login, account_server, account_bal, account_eq, account_float, account_lev, account_curr
   );

   if(PostJson(json))
   {
      PrintFormat("[CentTrade] [OK] Synced ticket #%I64u (%s %.2f lot, PnL: %.2f)", deal_ticket, symbol, volume, profit);
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Sync past deals from account history                             |
//+------------------------------------------------------------------+
void SyncRecentHistory()
{
   datetime from_date = TimeCurrent() - (InpSyncDays * 86400);
   datetime to_date   = TimeCurrent() + 86400;

   if(!HistorySelect(from_date, to_date))
   {
      Print("[CentTrade] Could not retrieve history deals.");
      return;
   }

   int total_deals = HistoryDealsTotal();
   PrintFormat("[CentTrade] Scanning %d deals from the past %d days...", total_deals, InpSyncDays);

   int count = 0;
   for(int i = 0; i < total_deals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT)
         {
            if(SendTradeWebhook(ticket)) count++;
         }
      }
   }
   PrintFormat("[CentTrade] History sync finished: %d deals sent.", count);
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=================================================");
   Print("  CentTrade PRO — MT5 AutoSync EA Initialized     ");
   PrintFormat("  Target: %s", InpServerUrl);
   Print("=================================================");

   if(InpEnableHeartbeat && InpHeartbeatInterval > 0)
   {
      EventSetTimer(InpHeartbeatInterval);
      SendAccountHeartbeat();
   }

   if(InpSyncHistoryOnStart)
   {
      SyncRecentHistory();
   }

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer event function for recurring equity heartbeats             |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(InpEnableHeartbeat)
   {
      SendAccountHeartbeat();
   }
}

//+------------------------------------------------------------------+
//| OnTradeTransaction listener for live deal close                  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   // Fires whenever a deal is added (position closed or balance operation)
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      SendTradeWebhook(trans.deal);
   }
}
