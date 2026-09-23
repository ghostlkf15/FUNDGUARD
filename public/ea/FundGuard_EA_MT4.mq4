//+------------------------------------------------------------------+
//|                                                   FundGuard.mq4  |
//|                           Copyright 2025, FUNDGUARD · Prop Firm  |
//|                                             https://fundguard.app |
//+------------------------------------------------------------------+
//| EA para MetaTrader 4. Reporta balance, equity, posiciones        |
//| abiertas y trades cerrados al endpoint POST /api/report.         |
//|                                                                    |
//| ⚙️  ANTES DE DISTRIBUIR EL .ex4 A TRADERS:                        |
//|    1. Cambia la constante EMBEDDED_WORKER_SECRET (abajo) por      |
//|       el WORKER_SECRET REAL de tu .env del hosting.              |
//|    2. Compila (F7) y distribuye SOLO el .ex4 resultante.         |
//|                                                                    |
//| 🎯 INPUTS QUE RELLENA EL TRADER (solo 3, sin secretos):           |
//|    • FundGuardAPI      → https://tu-dominio.com (sin barra final)|
//|    • ReportKey         → Copiada del Dashboard (empieza por fk_) |
//|    • ReportIntervalMs  → 3000 (no bajar de 1500)                 |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, FUNDGUARD"
#property link      "https://fundguard.app"
#property version   "1.10"
#property strict

// ╔══════════════════════════════════════════════════════════════════╗
// ║ 🔐 WORKER SECRET — REEMPLAZAME ANTES DE COMPILAR EL .ex4 FINAL ║
// ╚══════════════════════════════════════════════════════════════════╝
#define EMBEDDED_WORKER_SECRET "fg_wrk_3f2a1f5e8d6e4b9c7a0d3c5e8f1b6a4d9c2e7f0b5a8d4c1e3f6a9b2d5c8e7f1"

extern string FundGuardAPI       = "https://TU-DOMINIO.com";   // Sin / al final
extern string ReportKey          = "fk_CAMBIAME_POR_TU_REPORT_KEY_DEL_DASHBOARD";
extern string ChallengeId        = "";                 // Opcional — se auto-resuelve por ReportKey
extern int    ReportIntervalMs   = 3000;               // Mínimo recomendado 1500
extern bool   SimulateDemo       = false;              // true = genera ticks sintéticos (sin broker real)

datetime lastReportTime = 0;
int      ticketCounter  = 0;

#define LOG_PREFIX "[FundGuard-EA-MT4] "

string GetWorkerSecret()
{
   return (string)EMBEDDED_WORKER_SECRET;
}

string JsonEscape(string s)
{
   string r = "";
   int n = StringLen(s);
   for (int i = 0; i < n; i++)
   {
      int c = StringGetChar(s, i);
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
               ch = StringFormat("\\u%04x", c);
            else
               ch = CharToString(c);
      }
      r = r + ch;
   }
   return r;
}

string JsonStr(string v)  { return "\"" + JsonEscape(v) + "\""; }
string JsonNum(double v)  { return DoubleToString(v, 8); }
string JsonInt(int v)     { return IntegerToString(v); }
string JsonBool(bool v)   { return v ? "true" : "false"; }

string BuildPayload()
{
   double bal  = AccountBalance();
   double eq   = AccountEquity();
   string currency = AccountCurrency();

   if (SimulateDemo)
   {
      static double sBal = 100000;
      static double sEq  = 100000;
      static datetime lastSim = 0;
      if (TimeCurrent() - lastSim >= 1)
      {
         double drift = 0.00002;
         double noise = (MathRand() - 16383.5) / 32767.0 * 0.4;
         sEq = MathMax(1, sEq * (1 + (noise / 100) + drift));
         if (MathRand() < 491) // ~1.5%
         {
            double pnl = (sEq - sBal) * 0.05;
            sBal = sBal + pnl;
            sEq  = sBal;
         }
         lastSim = TimeCurrent();
      }
      bal = sBal;
      eq  = sEq;
   }

   string pairs = "";
   // Positions
   int posN = 0;
   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() == NULL) continue;
      string ticket   = IntegerToString(OrderTicket());
      string symbol   = OrderSymbol();
      string side     = OrderType() == OP_BUY ? "buy" : (OrderType() == OP_SELL ? "sell" : (OrderType() == OP_BUYLIMIT ? "buy_limit" : "sell_limit"));
      double volume   = OrderLots();
      double op       = OrderOpenPrice();
      string ot       = TimeToString(OrderOpenTime(), TIME_DATE|TIME_MINUTES|TIME_SECONDS);
      double sw       = OrderSwap();
      double cm       = OrderCommission();
      string kv =
         "{\"ticket\":" + JsonStr(ticket) +
         ",\"symbol\":" + JsonStr(symbol) +
         ",\"side\":" + JsonStr(side) +
         ",\"volume\":" + JsonNum(volume) +
         ",\"open_price\":" + JsonNum(op) +
         ",\"open_time\":" + JsonStr(ot + ".000Z") +
         ",\"swap\":" + JsonNum(sw) +
         ",\"commission\":" + JsonNum(cm) + "}";
      if (posN > 0) pairs = pairs + ",";
      pairs = pairs + kv;
      posN++;
   }

   string closed = "";
   int clN = 0;
   for (int j = OrdersHistoryTotal() - 1; j >= 0 && j >= OrdersHistoryTotal() - 60; j--)
   {
      if (!OrderSelect(j, SELECT_BY_POS, MODE_HISTORY)) continue;
      if (OrderType() != OP_BUY && OrderType() != OP_SELL) continue;
      datetime ct = OrderCloseTime();
      if (ct == 0) continue;
      if (TimeCurrent() - ct > 86400) continue; // último día
      string ctStr = TimeToString(ct, TIME_DATE|TIME_MINUTES|TIME_SECONDS) + ".000Z";
      string otStr  = TimeToString(OrderOpenTime(), TIME_DATE|TIME_MINUTES|TIME_SECONDS) + ".000Z";
      string kv =
         "{\"ticket\":" + JsonStr(IntegerToString(OrderTicket())) +
         ",\"symbol\":" + JsonStr(OrderSymbol()) +
         ",\"side\":" + JsonStr(OrderType() == OP_BUY ? "buy" : "sell") +
         ",\"volume\":" + JsonNum(OrderLots()) +
         ",\"open_price\":" + JsonNum(OrderOpenPrice()) +
         ",\"close_price\":" + JsonNum(OrderClosePrice()) +
         ",\"open_time\":" + JsonStr(otStr) +
         ",\"close_time\":" + JsonStr(ctStr) +
         ",\"pnl\":" + JsonNum(OrderProfit() + OrderSwap() + OrderCommission()) +
         ",\"swap\":" + JsonNum(OrderSwap()) +
         ",\"commission\":" + JsonNum(OrderCommission()) + "}";
      if (clN > 0) closed = closed + ",";
      closed = closed + kv;
      clN++;
   }

   string ts = TimeToStr(TimeCurrent(), TIME_DATE|TIME_MINUTES|TIME_SECONDS) + ".000Z";

   return
      "{" +
      "\"report_key\":" + JsonStr(ReportKey) + "," +
      "\"challenge_id\":" + JsonStr(ChallengeId) + "," +
      "\"balance\":" + JsonNum(bal) + "," +
      "\"equity\":" + JsonNum(eq) + "," +
      "\"currency\":" + JsonStr(currency) + "," +
      "\"timestamp\":" + JsonStr(ts) + "," +
      "\"broker_name\":" + JsonStr(AccountCompany()) + "," +
      "\"server_name\":" + JsonStr(AccountServer()) + "," +
      "\"server_timezone\":" + JsonStr("Etc/UTC") + "," +
      "\"open_positions\":[" + pairs + "]," +
      "\"closed_trades\":[" + closed + "]," +
      "\"ticket_counter\":" + JsonInt(ticketCounter) +
      "}";
}

// Very small HTTP POST via WinINet would be ideal; fallback: WebRequest
void PostReport()
{
   string url = FundGuardAPI;
   if (StringSubstr(url, StringLen(url) - 1, 1) == "/")
      url = StringSubstr(url, 0, StringLen(url) - 1);
   url = url + "/api/report";

   string headers =
      "Content-Type: application/json\r\n" +
      "X-Worker-Secret: " + GetWorkerSecret() + "\r\n" +
      "User-Agent: FundGuard-EA-MT4/1.10\r\n";

   string payload = BuildPayload();
   char data[];
   ArrayResize(data, StringLen(payload));
   for (int k = 0; k < StringLen(payload); k++)
      data[k] = (char)StringGetChar(payload, k);

   char resp[];
   int code = WebRequest("POST", url, NULL, 10000, headers, data, ArraySize(data), resp, "Content-Length");
   if (code < 0)
   {
      int err = GetLastError();
      if (err != 0) Print(LOG_PREFIX + "WebRequest error code=", err, " (enable WebRequest for this URL in MT4 Options -> Expert Advisors)");
   }
   else
   {
      ticketCounter++;
   }
}

int OnInit()
{
   Print(LOG_PREFIX + "Inicializado v1.10. Reportando a: ", FundGuardAPI, " cada ", ReportIntervalMs, "ms");
   if (StringLen(GetWorkerSecret()) < 12 || StringFind(GetWorkerSecret(), "CAMBIAME") >= 0)
      Print(LOG_PREFIX + "⚠️  CONFIGURA EMBEDDED_WORKER_SECRET ANTES DE COMPILAR EL .ex4 FINAL.");
   if (StringFind(ReportKey, "CAMBIAME") >= 0)
      Print(LOG_PREFIX + "⚠️  Introduce tu ReportKey (Dashboard → Conectar cuenta → Link EA MT4 → Copiar).");
   return(INIT_SUCCEEDED);
}

void OnTick()
{
   if (GetTickCount() - (int)lastReportTime * 1000 < ReportIntervalMs) return;
   lastReportTime = TimeCurrent();
   PostReport();
}
