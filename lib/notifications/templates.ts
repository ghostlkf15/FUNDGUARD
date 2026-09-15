export interface EmailTemplateArgs {
  userName: string;
  challengeName: string;
  phaseName: string;
  equity: string;
  balance: string;
  dailyDDPct: string;
  maxDDPct: string;
  profitPct: string;
  dailyLimitPct: string;
  maxLimitPct: string;
  targetPct: string;
  reason?: string;
  previewCta?: string;
  dashboardUrl: string;
}

export function wrapEmail(body: string) {
  return `
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:0; font-family: Inter, system-ui, -apple-system, sans-serif; background: #0c0b09; color: #f5efe0; }
  .wrap { max-width: 620px; margin: 0 auto; padding: 40px 24px; }
  .hero { border-radius: 18px; padding: 32px 28px; background: linear-gradient(135deg, rgba(241,202,99,0.12), rgba(181,113,8,0.06)); border: 1px solid rgba(241,202,99,0.22); }
  .logo { display:flex; align-items:center; gap:12px; margin-bottom: 18px; }
  .logo-badge { width:40px; height:40px; border-radius: 12px; background: linear-gradient(135deg, #F1CA63, #8E5208); display:flex; align-items:center; justify-content:center; }
  .h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 30px; margin: 0 0 8px; line-height: 1.1; }
  .accent { background: linear-gradient(90deg, #F7E19B, #D4920F, #B57108); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .lead { color: #c9bf9e; line-height: 1.6; }
  .card { margin-top:20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius:16px; padding: 20px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
  .row { display:flex; justify-content:space-between; padding:10px 12px; border-radius: 10px; background: rgba(255,255,255,0.02); }
  .row .k { color:#b4a57b; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
  .row .v { font-weight:600; }
  .pos { color: #34d399; } .neg { color: #fb7185; } .warn { color: #fbbf24; }
  .cta { display:inline-block; margin-top: 24px; padding: 14px 22px; border-radius: 12px; color:#0b0b09; font-weight:700; text-decoration:none; background: linear-gradient(135deg, #F1CA63, #D4920F, #B57108); letter-spacing: 0.02em; }
  .foot { margin-top: 28px; color:#6b6350; font-size:12px; line-height:1.6; }
  .chip { display:inline-block; padding: 4px 10px; font-size:11px; border-radius:999px; letter-spacing:0.08em; text-transform:uppercase; font-weight:700; border:1px solid rgba(241,202,99,0.3); color: #F1CA63; background: rgba(241,202,99,0.06); }
</style></head>
<body>
  <div class="wrap">${body}
    <div class="foot">
      FUNDGUARD · TKECH / LKALGORITMIC<br/>
      Plataforma de simulación de pruebas de fondeo. Nunca compartimos tus credenciales del broker.
    </div>
  </div>
</body></html>`;
}

export function emailApproved(args: EmailTemplateArgs) {
  return wrapEmail(`
    <div class="hero">
      <div class="logo">
        <div class="logo-badge">🏆</div>
        <div><div class="chip">Aprobación</div></div>
      </div>
      <h1 class="h1">¡Felicidades, <span class="accent">${args.userName}</span>!</h1>
      <p class="lead">Tu desafío <strong>${args.challengeName}</strong> · ${args.phaseName} ha sido <strong class="accent">APROBADO</strong>.</p>
      <div class="card">
        <div class="grid">
          <div class="row"><span class="k">Equity final</span><span class="v">${args.equity}</span></div>
          <div class="row"><span class="k">Rentabilidad</span><span class="v pos">${args.profitPct}</span></div>
          <div class="row"><span class="k">DD diario máximo</span><span class="v">${args.dailyDDPct} / ${args.dailyLimitPct}</span></div>
          <div class="row"><span class="k">DD total máximo</span><span class="v">${args.maxDDPct} / ${args.maxLimitPct}</span></div>
        </div>
      </div>
      <a class="cta" href="${args.dashboardUrl}">${args.previewCta || "Ver resultado en dashboard"} →</a>
    </div>`);
}

export function emailFailed(args: EmailTemplateArgs) {
  return wrapEmail(`
    <div class="hero" style="border-color: rgba(251,113,133,0.25); background: linear-gradient(135deg, rgba(251,113,133,0.10), rgba(241,202,99,0.03));">
      <div class="logo">
        <div class="logo-badge" style="background: linear-gradient(135deg, #fb7185, #e11d48);">❌</div>
        <div><div class="chip" style="border-color: rgba(251,113,133,0.35); color:#fecdd3; background: rgba(251,113,133,0.08);">Reprobación</div></div>
      </div>
      <h1 class="h1">Lo sentimos, ${args.userName}</h1>
      <p class="lead">El desafío <strong>${args.challengeName}</strong> ha sido reprobado.</p>
      <div class="card">
        <div class="row"><span class="k">Motivo</span><span class="v neg">${args.reason || "Regla violada"}</span></div>
        <div class="grid" style="margin-top:10px;">
          <div class="row"><span class="k">DD diario</span><span class="v ${Number(args.dailyDDPct) > Number(args.dailyLimitPct) * 0.8 ? "neg" : ""}">${args.dailyDDPct} / ${args.dailyLimitPct}</span></div>
          <div class="row"><span class="k">DD total</span><span class="v ${Number(args.maxDDPct) > Number(args.maxLimitPct) * 0.8 ? "neg" : ""}">${args.maxDDPct} / ${args.maxLimitPct}</span></div>
          <div class="row"><span class="k">Equity</span><span class="v">${args.equity}</span></div>
          <div class="row"><span class="k">Balance</span><span class="v">${args.balance}</span></div>
        </div>
      </div>
      <a class="cta" href="${args.dashboardUrl}">Ver detalles en dashboard →</a>
    </div>`);
}

export function emailDailyAlert(args: EmailTemplateArgs) {
  return wrapEmail(`
    <div class="hero" style="border-color: rgba(251,191,36,0.25); background: linear-gradient(135deg, rgba(251,191,36,0.10), rgba(241,202,99,0.04));">
      <div class="logo">
        <div class="logo-badge" style="background: linear-gradient(135deg, #fbbf24, #d97706);">⚠️</div>
        <div><div class="chip" style="border-color: rgba(251,191,36,0.35); color:#fde68a; background: rgba(251,191,36,0.08);">Alerta DD diario</div></div>
      </div>
      <h1 class="h1">Cuidado con el <span class="accent">Drawdown Diario</span></h1>
      <p class="lead">Tu desafío <strong>${args.challengeName}</strong> está cerca del límite diario.</p>
      <div class="card">
        <div class="row"><span class="k">DD diario actual</span><span class="v warn">${args.dailyDDPct}% / ${args.dailyLimitPct}%</span></div>
        <div class="row" style="margin-top:10px;"><span class="k">Equity</span><span class="v">${args.equity}</span></div>
      </div>
      <a class="cta" href="${args.dashboardUrl}">Monitorea tu dashboard →</a>
    </div>`);
}
