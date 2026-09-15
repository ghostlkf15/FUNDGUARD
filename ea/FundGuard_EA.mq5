//+------------------------------------------------------------------+
//|                                                    FundGuard.mq5 |
//|                           Copyright 2025, FUNDGUARD · Prop Firm  |
//|                                             https://fundguard.app |
//+------------------------------------------------------------------+
//| EA (Asesor Experto) para MetaTrader 5. Reporta balance, equity,  |
//| posiciones abiertas y trades cerrados al endpoint /api/report.   |
//|                                                                    |
//| ⚙️  ANTES DE DISTRIBUIR EL .ex5 A TRADERS:                        |
//|    1. Cambia la constante EMBEDDED_WORKER_SECRET (abajo) por      |
//|       el WORKER_SECRET REAL de tu .env del hosting Spaceship.    |
//|    2. Compila (F7) y distribuye SOLO el .ex5 resultante.         |
//|                                                                    |
//| 🎯 INPUTS QUE RELLENA EL TRADER (solo 3, sin secretos):           |
//|    • FundGuardAPI      → https://tu-dominio.com (sin barra final)|
//|    • ReportKey         → Copiada del Dashboard (empieza por fk_) |
//|    • ReportIntervalMs  → 3000 (no bajar de 1500)                 |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, FUNDGUARD"
#property link      "https://tkech.com"
#property version   "1.10"
#property strict

#include <Trade\Trade.mqh>

// ╔══════════════════════════════════════════════════════════════════╗
// ║ 🔐 WORKER SECRET — REEMPLAZAME ANTES DE COMPILAR EL .ex5 FINAL ║
// ╠══════════════════════════════════════════════════════════════════╣
// ║  Copia aquí el valor WORKER_SECRET= de tu .env del hosting.     ║
// ║  El trader NUNCA verá este valor (está compilado dentro .ex5).  ║
// ╚══════════════════════════════════════════════════════════════════╝
#define EMBEDDED_WORKER_SECRET "fg_wrk_3f2a1f5e8d6e4b9c7a0d3c5e8f1b6a4d9c2e7f0b5a8d4c1e3f6a9b2d5c8e7f1"

input string FundGuardAPI       = "https://TU-DOMINIO.com";   // Sin / al final
input string ReportKey          = "fk_CAMBIAME_POR_TU_REPORT_KEY_DEL_DASHBOARD";
input string ChallengeId        = "";                 // Opcional — se auto-resuelve por ReportKey
input int    ReportIntervalMs   = 3000;               // Mínimo recomendado 1500
input bool   SimulateDemo       = false;              // true = genera ticks sintéticos (sin broker real)

ulong lastReportTicks = 0;
int   ticketCounter  = 0;

#define LOG_PREFIX "[FundGuard-EA] "

string GetWorkerSecret()
{
   return (string)EMBEDDED_WORKER_SECRET;
}

//+------------------------------------------------------------------+
// Helpers JSON nativos (SIN librería externa <JSON/JSON.mqh>)      |
// Build string JSON a mano, compatible todos los builds de MT5.    |
//+------------------------------------------------------------------+
string JsonEscape(string s)
{
   string r = "";
   int n = StringLen(s);
   for (int i = 0; i < n; i++)
   {
      ushort c = StringGetCharacter(s, i);
      string ch;
      switch (c)
      {
         case 34:   ch = "\\\""; break;   // "
         case 92:   ch = "\\\\"; break;   // backslash
         case 8:    ch = "\\b";  break;
         case 12:   ch = "\\f";  break;
         case 10:   ch = "\\n";  break;
         case 13:   ch = "\\r";  break;
         case 9:    ch = "\\t";  break;
         default:
            if (c < 0x20)
               ch = StringFormat("\\u%04x", (uint)c);
            else
               ch = ShortToString(c);
      }
      r += ch;
   }
   return r;
}

string JsonString(string v) { return "\"" + JsonEscape(v) + "\""; }
string JsonNum(double v)    { return DoubleToString(v, 8); }
string JsonInt(long v)      { return IntegerToString(v); }
string JsonBool(bool v)     { return v ? "true" : "false"; }
string JsonObjKV(string &pairs[][2], int n)
{
   string r = "{";
   for (int i = 0; i < n; i++)
   {
      if (i > 0) r += ",";
      r += "\"" + JsonEscape(pairs[i][0]) + "\":" + pairs[i][1];
   }
   r += "}";
   return r;
}
string JsonArrStr(string &items[], int n)
{
   string r = "[";
   for (int i = 0; i < n; i++)
   {
      if (i > 0) r += ",";
      r += items[i];
   }
   r += "]";
   return r;
}

//+------------------------------------------------------------------+
int OnInit()
{
   Print(LOG_PREFIX + "Inicializado v1.10. Reportando a: ", FundGuardAPI, " cada ", ReportIntervalMs, "ms");
   if (StringLen(GetWorkerSecret()) < 12 || StringFind(GetWorkerSecret(), "CAMBIAME") >= 0)
   {
      Print(LOG_PREFIX + "⚠️  CONFIGURA EMBEDDED_WORKER_SECRET DENTRO DEL .MQ5 ANTES DE COMPILAR EL .ex5 FINAL.");
   }
   if (StringFind(ReportKey, "CAMBIAME") >= 0)
   {
      Print(LOG_PREFIX + "⚠️  Introduce tu ReportKey (Dashboard → Conectar cuenta → Link EA MT5 → Copiar).");
   }
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnTick()
{
   const ulong now = GetTickCount64();
   if (now - lastReportTicks < (ulong)ReportIntervalMs) return;
   lastReportTicks = now;
   SendReportAsync();
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print(LOG_PREFIX + "Desinicializado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
string BuildPayloadJSON()
{
   string closed[];
   string open[];
   int closedN = 0;
   int openN = 0;

   if (SimulateDemo)
   {
      int nDemo = MathRand() % 4;
      for (int i = 0; i < nDemo; i++)
      {
         ticketCounter++;
         string symbol = (MathRand() % 2 == 0) ? "EURUSD" : "XAUUSD";
         string side = (MathRand() % 2 == 0) ? "buy" : "sell";
         double vol = 0.10 + (MathRand() % 90) / 100.0;
         double openP = 1.08000 + (MathRand() % 1000) / 100000.0;
         double closeP = 1.08000 + (MathRand() % 1000) / 100000.0;
         string ot = ISO8601(TimeCurrent() - 60 - MathRand() % 300);
         string ct = ISO8601(TimeCurrent());
         double pnl = NormalizeDouble((MathRand() - 500.0) / 10.0, 2);
         string pairs[][2] = {
            {"ticket",       JsonInt(ticketCounter)},
            {"symbol",       JsonString(symbol)},
            {"side",         JsonString(side)},
            {"volume",       JsonNum(vol)},
            {"open_price",   JsonNum(openP)},
            {"close_price",  JsonNum(closeP)},
            {"open_time",    JsonString(ot)},
            {"close_time",   JsonString(ct)},
            {"pnl",          JsonNum(pnl)},
            {"swap",         JsonNum(-0.02)},
            {"commission",   JsonNum(-0.04)}
         };
         ArrayResize(closed, closedN + 1);
         closed[closedN] = JsonObjKV(pairs, 11);
         closedN++;
      }
   }
   else
   {
      // ── Trades cerrados del history (últimas 2h) ──────────────
      datetime from = TimeCurrent() - 7200;
      if (HistorySelect(from, TimeCurrent()))
      {
         const int total = HistoryDealsTotal();
         int cap = MathMin(total, 200);
         for (int i = total - 1; i >= 0 && (total - 1 - i) < cap; i--)
         {
            ulong dealTkt = HistoryDealGetTicket(i);
            if (dealTkt == 0) continue;
            if ((ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTkt, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;

            long   posId    = HistoryDealGetInteger(dealTkt, DEAL_POSITION_ID);
            string sym      = HistoryDealGetString(dealTkt, DEAL_SYMBOL);
            double vol      = HistoryDealGetDouble(dealTkt, DEAL_VOLUME);
            double priceIn  = HistoryDealGetDouble(dealTkt, DEAL_PRICE);
            double priceOut = HistoryDealGetDouble(dealTkt, DEAL_PRICE);
            double pnl      = HistoryDealGetDouble(dealTkt, DEAL_PROFIT)
                            + HistoryDealGetDouble(dealTkt, DEAL_SWAP)
                            + HistoryDealGetDouble(dealTkt, DEAL_COMMISSION);
            datetime tIn    = (datetime)HistoryDealGetInteger(dealTkt, DEAL_TIME_MSC);
            datetime tOut   = (datetime)HistoryDealGetInteger(dealTkt, DEAL_TIME);
            ENUM_DEAL_TYPE dType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTkt, DEAL_TYPE);
            string side = (dType == DEAL_TYPE_BUY) ? "buy" : "sell";

            string pairs[][2] = {
               {"ticket",       JsonInt(posId)},
               {"symbol",       JsonString(sym)},
               {"side",         JsonString(side)},
               {"volume",       JsonNum(vol)},
               {"open_price",   JsonNum(priceIn)},
               {"close_price",  JsonNum(priceOut)},
               {"open_time",    JsonString(ISO8601(tIn))},
               {"close_time",   JsonString(ISO8601(tOut))},
               {"pnl",          JsonNum(NormalizeDouble(pnl, 2))},
               {"swap",         JsonNum(HistoryDealGetDouble(dealTkt, DEAL_SWAP))},
               {"commission",   JsonNum(HistoryDealGetDouble(dealTkt, DEAL_COMMISSION))}
            };
            ArrayResize(closed, closedN + 1);
            closed[closedN] = JsonObjKV(pairs, 11);
            closedN++;
         }
      }

      // ── Posiciones abiertas ──────────────────────────────────
      int totP = PositionsTotal();
      for (int i = totP - 1; i >= 0; i--)
      {
         ulong tkt = PositionGetTicket(i);
         if (!PositionSelectByTicket(tkt)) continue;
         ENUM_POSITION_TYPE pType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         string side = (pType == POSITION_TYPE_BUY) ? "buy" : "sell";
         string pairs[][2] = {
            {"ticket",     JsonInt((long)tkt)},
            {"symbol",     JsonString(PositionGetString(POSITION_SYMBOL))},
            {"side",       JsonString(side)},
            {"volume",     JsonNum(PositionGetDouble(POSITION_VOLUME))},
            {"open_price", JsonNum(PositionGetDouble(POSITION_PRICE_OPEN))},
            {"open_time",  JsonString(ISO8601((datetime)PositionGetInteger(POSITION_TIME)))}
         };
         ArrayResize(open, openN + 1);
         open[openN] = JsonObjKV(pairs, 6);
         openN++;
      }
   }

   double balance, equity;
   string currency = "USD", brokerName = "", serverName = "";
   if (SimulateDemo)
   {
      static double sBal = 100000.0;
      static double sEq  = 100000.0;
      sEq = sEq * (1.0 + ((double)MathRand() - 16383.5) / 2000000.0);
      balance = sBal;
      equity  = sEq;
   }
   else
   {
      balance    = AccountInfoDouble(ACCOUNT_BALANCE);
      equity     = AccountInfoDouble(ACCOUNT_EQUITY);
      currency   = AccountInfoString(ACCOUNT_CURRENCY);
      brokerName = AccountInfoString(ACCOUNT_COMPANY);
      serverName = AccountInfoString(ACCOUNT_SERVER);
   }

   string openStr = JsonArrStr(open, openN);
   string closedStr = JsonArrStr(closed, closedN);

   int rootN = 10 + ((StringLen(ChallengeId) > 0) ? 1 : 0);
   int idx = 0;
   string rootPairs[11][2];
   rootPairs[idx][0] = "report_key";   rootPairs[idx][1] = JsonString(ReportKey);           idx++;
   if (StringLen(ChallengeId) > 0)
   {
      rootPairs[idx][0] = "challenge_id"; rootPairs[idx][1] = JsonString(ChallengeId);         idx++;
   }
   rootPairs[idx][0] = "balance";      rootPairs[idx][1] = JsonNum(balance);                idx++;
   rootPairs[idx][0] = "equity";       rootPairs[idx][1] = JsonNum(equity);                 idx++;
   rootPairs[idx][0] = "currency";     rootPairs[idx][1] = JsonString(currency);            idx++;
   rootPairs[idx][0] = "timestamp";    rootPairs[idx][1] = JsonString(ISO8601(TimeCurrent())); idx++;
   rootPairs[idx][0] = "broker_name";  rootPairs[idx][1] = JsonString(brokerName);          idx++;
   rootPairs[idx][0] = "server_name";  rootPairs[idx][1] = JsonString(serverName);          idx++;
   rootPairs[idx][0] = "server_timezone"; rootPairs[idx][1] = JsonString("Etc/UTC");        idx++;
   rootPairs[idx][0] = "open_positions"; rootPairs[idx][1] = openStr;                       idx++;
   rootPairs[idx][0] = "closed_trades";  rootPairs[idx][1] = closedStr;                     idx++;

   return JsonObjKV(rootPairs, idx);
}

//+------------------------------------------------------------------+
void SendReportAsync()
{
   const string url = FundGuardAPI + "/api/report";
   const string payload = BuildPayloadJSON();

   const string headers =
      "Content-Type: application/json\r\n"
      "X-Worker-Secret: " + GetWorkerSecret() + "\r\n";

   uchar body[];
   StringToCharArray(payload, body);

   uchar resp[];
   ArrayResize(resp, 8192);
   string respHeaders;

   ResetLastError();
   int h = WebRequest("POST",
                      url,
                      NULL,       // cookies
                      headers,
                      10000,      // timeout ms
                      body,       // request body
                      ArraySize(body),
                      resp,       // response buffer
                      respHeaders);

   if (h == -1)
   {
      Print(LOG_PREFIX + "❌ WebRequest falló. Error=", GetLastError(),
            " (recuerda: en MT5 → Herramientas → Opciones → Asesores → "
            "permite URLs '", FundGuardAPI, "' y habilita WebRequest)");
      return;
   }

   // h es el código HTTP (200, 401, 500…), NO un handle. NO hace falta WebResponse ni WebRequestFree.
   string respStr = CharArrayToString(resp);
   if (h >= 200 && h < 300 && StringFind(respStr, "\"ok\":true") > 0)
   {
      Print(LOG_PREFIX + "✅ Report OK (HTTP ", h, "). ", respStr);
   }
   else
   {
      Print(LOG_PREFIX + "⚠️  Report HTTP ", h, ". response=", respStr);
   }
}

//+------------------------------------------------------------------+
// Helpers
string ISO8601(datetime t)
{
   MqlDateTime dt;
   TimeToStruct(t, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       dt.year, dt.mon + 1, dt.day, dt.hour, dt.min, dt.sec);
}
//+------------------------------------------------------------------+
