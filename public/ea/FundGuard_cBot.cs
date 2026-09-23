// ============================================================
//  FUNDGUARD · cBot para cTrader (cAlgo)
// ------------------------------------------------------------
//  Reporta balance / equity / posiciones / trades cerrados al
//  endpoint POST /api/report de FUNDGUARD cada 3 segundos.
//
//  INSTALACIÓN:
//    1. Abrir cAlgo → Bots → Nuevo → "Build from source"
//       → pegar este código → compilar.
//    2. Añadir el cBot al VPS o instancia local.
//    3. En parámetros rellenar:
//       • FundGuardApiBase    : https://TU-DOMINIO.com (sin /)
//       • WorkerSecret        : WORKER_SECRET de .env.local
//       • ReportKey           : Clave del desafío (Dashboard →
//                               Conectar cuenta → cBot cTrader)
//       • ChallengeId         : Opcional
//       • ReportIntervalMs    : 3000 (mínimo recomendado 1500)
// ============================================================

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using cAlgo.API;
using cAlgo.API.Internals;
using Newtonsoft.Json;   // NuGet: Newtonsoft.Json (añadir referencia)

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class FundGuardcBot : Robot
    {
        // ── Parameters ──────────────────────────────────────────
        [Parameter("FundGuard API Base URL", DefaultValue = "https://TU-DOMINIO.com")]
        public string FundGuardApiBase { get; set; }

        [Parameter("Worker Secret", DefaultValue = "fg_wrk_CAMBIAME_POR_EL_DE_TU_ENV_LOCAL")]
        public string WorkerSecret { get; set; }

        [Parameter("Report Key", DefaultValue = "fk_CAMBIAME_POR_TU_REPORT_KEY_DEL_DASHBOARD")]
        public string ReportKey { get; set; }

        [Parameter("Challenge ID (optional)")]
        public string ChallengeId { get; set; }

        [Parameter("Report Interval (ms)", DefaultValue = 3000, MinValue = 1500)]
        public int ReportIntervalMs { get; set; }

        [Parameter("Enable Demo Mode (synthetic)", DefaultValue = false)]
        public bool DemoMode { get; set; }

        // ── Private state ───────────────────────────────────────
        private HttpClient _http;
        private DateTime _lastReport;
        private Random _rng = new Random();
        private int _ticketCounter;
        private double _simBal = 100000;
        private double _simEq = 100000;

        protected override void OnStart()
        {
            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            _http.DefaultRequestHeaders.UserAgent.ParseAdd("FundGuard-cBot/1.0");
            Print("[FundGuard-cBot] Iniciado. Reportando a: ", FundGuardApiBase);
            if (WorkerSecret.Contains("CAMBIAME") || ReportKey.Contains("CAMBIAME"))
            {
                Print("[FundGuard-cBot] ⚠️ CONFIGURA WorkerSecret y ReportKey.");
            }
            _lastReport = DateTime.UtcNow.AddMilliseconds(-ReportIntervalMs);
        }

        protected override void OnTick()
        {
            if ((DateTime.UtcNow - _lastReport).TotalMilliseconds < ReportIntervalMs)
                return;
            _lastReport = DateTime.UtcNow;
            SendReport().ContinueWith(t =>
            {
                if (t.IsFaulted)
                    Print("[FundGuard-cBot] Error: ", t.Exception?.InnerException?.Message);
            });
        }

        protected override void OnStop()
        {
            _http?.Dispose();
            Print("[FundGuard-cBot] Detenido.");
        }

        // ── Report payload build & POST ─────────────────────────
        private async System.Threading.Tasks.Task SendReport()
        {
            var payload = BuildPayload();
            var json = JsonConvert.SerializeObject(payload, Formatting.None);
            var request = new HttpRequestMessage(HttpMethod.Post,
                (FundGuardApiBase ?? "").TrimEnd('/') + "/api/report");
            request.Headers.Add("X-Worker-Secret", WorkerSecret);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            try
            {
                using var response = await _http.SendAsync(request)
                    .ConfigureAwait(false);
                var content = await response.Content.ReadAsStringAsync()
                    .ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                    Print($"[FundGuard-cBot] HTTP {(int)response.StatusCode}: {content}");
                else if (content.Contains("\"ok\":true"))
                    Print($"[FundGuard-cBot] ✅ Report OK — {content}");
            }
            catch (HttpRequestException ex)
            {
                Print("[FundGuard-cBot] Network error: ", ex.Message);
            }
        }

        private object BuildPayload()
        {
            List<object> openPositions, closedTrades;
            double balance, equity;

            if (DemoMode)
            {
                openPositions = new List<object>();
                closedTrades = new List<object>();
                _simEq = _simEq * (1.0 + (_rng.NextDouble() - 0.5) * 0.0004);
                if (_rng.NextDouble() < 0.02)
                {
                    _ticketCounter++;
                    var pnl = (_simEq - _simBal) * 0.05;
                    _simBal = Math.Max(1, _simBal + pnl);
                    _simEq = _simBal;
                    closedTrades.Add(new
                    {
                        ticket = _ticketCounter.ToString(),
                        symbol = _rng.Next(2) == 0 ? "EURUSD" : "XAUUSD",
                        side = _rng.Next(2) == 0 ? "buy" : "sell",
                        volume = Math.Round(0.01 + _rng.NextDouble() * 0.99, 2),
                        open_price = Math.Round(1.08 + _rng.NextDouble() * 0.001, 5),
                        close_price = Math.Round(1.08 + _rng.NextDouble() * 0.001, 5),
                        open_time = DateTime.UtcNow.AddMinutes(-1 - _rng.Next(4)).ToString("O"),
                        close_time = DateTime.UtcNow.ToString("O"),
                        pnl = Math.Round(pnl, 2),
                        swap = -0.02,
                        commission = -0.04,
                    });
                }
                if (_rng.NextDouble() < 0.3)
                {
                    openPositions.Add(new
                    {
                        ticket = "OPN-" + _rng.Next(1000000),
                        symbol = "GBPUSD",
                        side = "buy",
                        volume = 0.30,
                        open_price = 1.26543,
                        open_time = DateTime.UtcNow.AddMinutes(-1).ToString("O"),
                        swap = 0.0,
                        commission = 0.0,
                    });
                }
                balance = Math.Round(_simBal, 2);
                equity = Math.Round(_simEq, 2);
            }
            else
            {
                openPositions = new List<object>();
                foreach (var pos in Positions)
                {
                    openPositions.Add(new
                    {
                        ticket = pos.Id.ToString(),
                        symbol = pos.SymbolName,
                        side = pos.TradeType == TradeType.Buy ? "buy" : "sell",
                        volume = Math.Round(pos.VolumeInUnits / 100000.0, 2),
                        open_price = pos.EntryPrice,
                        open_time = pos.EntryTime.ToString("O"),
                        swap = 0.0,
                        commission = 0.0,
                    });
                }

                closedTrades = new List<object>();
                var since = DateTime.UtcNow.AddHours(-2);
                foreach (var h in History)
                {
                    var last = History.Count > 500 ? History.Count - 500 : 0;
                    for (int i = History.Count - 1; i >= last; i--)
                    {
                        var trade = History[i];
                        if (trade.EntryTime < since) break;
                        closedTrades.Add(new
                        {
                            ticket = trade.PositionId.ToString(),
                            symbol = trade.SymbolName,
                            side = trade.TradeType == TradeType.Buy ? "buy" : "sell",
                            volume = Math.Round(trade.VolumeInUnits / 100000.0, 2),
                            open_price = trade.EntryPrice,
                            close_price = trade.ClosingPrice,
                            open_time = trade.EntryTime.ToString("O"),
                            close_time = trade.ClosingTime.ToString("O"),
                            pnl = Math.Round(trade.NetProfit, 2),
                            swap = Math.Round(trade.Swap, 2),
                            commission = Math.Round(trade.Commission, 2),
                        });
                    }
                    break;
                }

                balance = Math.Round(Account.Balance, 2);
                equity = Math.Round(Account.Equity, 2);
            }

            return new
            {
                report_key = ReportKey,
                challenge_id = string.IsNullOrWhiteSpace(ChallengeId) ? null : ChallengeId,
                balance,
                equity,
                currency = Account.Asset.Name,
                timestamp = DateTime.UtcNow.ToString("O"),
                broker_name = "cTrader",
                server_name = Server.Name,
                server_timezone = "Etc/UTC",
                open_positions = openPositions,
                closed_trades = closedTrades,
            };
        }
    }
}
