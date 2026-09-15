import type { Firm, FirmPreset, MarketType } from "@/lib/types";

const now = new Date().toISOString();

// =========================================================================
// 15 FIRMAS (IDs COHERENTES con supabase/seed.sql)
//  - No editar los IDs a mano: seed.sql es el origen de verdad
// =========================================================================
export const DEFAULT_FIRMS: Firm[] = [
  // Forex (7 firmas: FTMO, Bullfy, FX Live Capital FOREX, Upcomers Forex, FundedNext, The 5%ers, FundingPips)
  {
    id: "firm-ftmo",
    name: "FTMO",
    slug: "ftmo",
    market: "forex",
    website_url: "https://ftmo.com",
    logo_url: "/images/ftmo.png",
    description: "FTMO · 2-Step Challenge+Verification (10%/5% static · DD día 5%) y 1-Step (10% trailing · DD día 3%). Consistency Rule 50% Best Day (warning, no fail).",
    is_active: true,
    is_featured: true,
    order_index: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-bullfy",
    name: "Bullfy",
    slug: "bullfy",
    market: "forex",
    website_url: "https://bullfy.com",
    logo_url: "/images/bullfy.jpg",
    description: "Bullfy · MT5 · 3 productos: Bull One 1-fase (12%/5d, 5% diario 10% total static), Bull Prime 2-fases (8%/5% 3d), Bull Titan fondeo directo (3%/6% 3d). Static DD por VIDA (incluida cuenta fondeada). Tamaños: $5K-$200K.",
    is_active: true,
    is_featured: true,
    order_index: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-fxlivecap",
    name: "FX Live Capital",
    slug: "fx-live-capital",
    market: "forex",
    website_url: "https://fxlivecapital.com",
    logo_url: "/images/fxlivecapital.png",
    description: "FX Live Capital · MT5 · 4 programas: Boost+ 2-Step (10%/8% · 5%/10% · 3/90 días), Live FX 1-Step (10% · 5%/10% · 3/90), Power Live Fondeo Directo (95% profit share · retiro diario) y Live Synthetics 1-Step. DD sin confirmar = tratado como static. Holding fin de semana permitido en todos los productos. Tope 10% mensual en sintéticos.",
    is_active: true,
    is_featured: true,
    order_index: 3,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-upcomers-fx",
    name: "Upcomers Forex",
    slug: "upcomers-forex",
    market: "forex",
    website_url: "https://upcomers.com",
    logo_url: "/images/upcommers.jpg",
    description: "Upcomers · rampa competiciones en Forex.",
    is_active: true,
    is_featured: false,
    order_index: 4,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-fundednext",
    name: "FundedNext",
    slug: "fundednext",
    market: "forex",
    website_url: "https://fundednext.com",
    logo_url: "/images/fundednext.png",
    description: "Stellar Challenge 2 pasos con payout instantáneo.",
    is_active: true,
    is_featured: true,
    order_index: 5,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-the5ers",
    name: "The 5%ers",
    slug: "the5ers",
    market: "forex",
    website_url: "https://the5ers.com",
    logo_url: "/images/the5ers.jpg",
    description: "Programas low-stakes con scaling plan agresivo.",
    is_active: true,
    is_featured: true,
    order_index: 6,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-fundingpips",
    name: "FundingPips",
    slug: "fundingpips",
    market: "forex",
    website_url: "https://fundingpips.com",
    logo_url: "/images/fundingpips.jpg",
    description: "Reglas claras y dashboard en español.",
    is_active: true,
    is_featured: false,
    order_index: 7,
    created_at: now,
    updated_at: now,
  },

  // Futures (5 firmas)
  {
    id: "firm-apex",
    name: "Apex Trader Funding",
    slug: "apex",
    market: "futures",
    website_url: "https://apextraderfunding.com",
    logo_url: "/images/apex.png",
    description: "El prop #1 en Futuros · Trailing activo en evaluación.",
    is_active: true,
    is_featured: true,
    order_index: 8,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-lucid",
    name: "Lucid Funding",
    slug: "lucid",
    market: "futures",
    website_url: "https://lucidfutures.com",
    logo_url: "/images/lucid.jpg",
    description: "NQ/ES friendly, scalping permitido y reglas simples.",
    is_active: true,
    is_featured: true,
    order_index: 9,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-upcomers-fu",
    name: "Upcomers Futuros",
    slug: "upcomers-fut",
    market: "futures",
    website_url: "https://upcomers.com",
    logo_url: "/images/upcommers.jpg",
    description: "Upcomers · NQ/MNQ/ES/MES todos permitidos.",
    is_active: true,
    is_featured: false,
    order_index: 10,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-topstep",
    name: "Topstep",
    slug: "topstep",
    market: "futures",
    website_url: "https://topstep.com",
    logo_url: "/images/topstep.png",
    description: "Topstep · Express y Combine originales, payout semanal.",
    is_active: true,
    is_featured: true,
    order_index: 11,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-myfundedfu",
    name: "MyFundedFutures",
    slug: "my-funded-fu",
    market: "futures",
    website_url: "https://myfundedfutures.com",
    logo_url: "/images/myfundedfutures.png",
    description: "Evaluaciones rápidas, sin reglas EOD estrictas.",
    is_active: true,
    is_featured: false,
    order_index: 12,
    created_at: now,
    updated_at: now,
  },

  // Crypto (1 firma: Upcomers Crypto)
  {
    id: "firm-upcomers-crypto",
    name: "Upcomers Crypto",
    slug: "upcomers-crypto",
    market: "crypto",
    website_url: "https://upcomers.com",
    logo_url: "/images/upcommers.jpg",
    description: "Upcomers · Rampa de desafíos en Criptomonedas vía CCXT (Binance · Bybit · OKX · Coinbase · Kraken · KuCoin). API read-only, sin permiso de trading ni retiros. 2-Step Challenge estándar: 10% obj / 5% DD diario / 10% DD total / 4 días mín.",
    is_active: true,
    is_featured: true,
    order_index: 13,
    created_at: now,
    updated_at: now,
  },

  // Synthetic Indices (2 firmas: Deriv + FX Live Capital Synthetic)
  {
    id: "firm-synthetic",
    name: "Synthetic Indices (Deriv)",
    slug: "synthetic-deriv",
    market: "synthetic_indices",
    website_url: "https://deriv.com",
    logo_url: undefined,
    description: "Índices sintéticos 24/7: Boom & Crash 300/500/1000, Volatility 10-100 (1s), Step Index, Jump Index, Range Break 100-200. Correlación cero con mercados reales — disponibilidad 365 días, weekends incluido. Drawdown Static, 1-Step Challenge 10% obj / 5% DD diario / 10% DD total / 4 días mínimos.",
    is_active: true,
    is_featured: true,
    order_index: 14,
    created_at: now,
    updated_at: now,
  },
  {
    id: "firm-fxlivecap-synth",
    name: "FX Live Capital · Synthetic",
    slug: "fx-live-capital-synthetic",
    market: "synthetic_indices",
    website_url: "https://fxlivecapital.com",
    logo_url: "/images/fxlivecapital.png",
    description: "FX Live Capital · Split prop sintéticos oficial. Live Synthetics 1-Step: 10% obj / 4% DD diario / 8% DD total estático · 3 días mín / 90 días máx · 1:50 leverage · tope 10% ganancia mensual · scalping ilimitado · 24/7 trading · fines de semana OK · profit share 80% · fee reembolsable · solo activos sintéticos (Boom & Crash / Volatility / Step / Jump / Range Break).",
    is_active: true,
    is_featured: true,
    order_index: 15,
    created_at: now,
    updated_at: now,
  },
];

// =========================================================================
// REGLA DE PRESETS: 5 tamaños × 2 fases = 60 presets.
// ID MATCH: `CONCAT(firm.id, '-preset-', LPAD(bal::text, 6, '0'))`
//   Ex: $10,000  → firm-ftmo-preset-010000
//       $200,000 → firm-ftmo-preset-200000
// =========================================================================
const SIZES: number[] = [10000, 25000, 50000, 100000, 200000];
const SIZES_BULLFY: number[] = [5000, 10000, 25000, 50000, 100000, 200000];
const SIZES_FXLC_BOOSTPLUS: number[] = [7500, 13500, 22500, 37500, 75000];
const SIZES_FXLC_LIVEFX: number[] = [5000, 10000, 25000, 50000, 100000];
const SIZES_FXLC_POWERLIVE: number[] = [500, 5000, 10000, 25000, 50000];
const SIZES_FXLC_SYNTH: number[] = [5000, 10000, 20000, 25000, 50000];

function padBal6(b: number) { return String(b).padStart(6, "0"); }

function buildPhasesFor(f: Firm, size: number, variant: "2step" | "1step" | "titan" | "boostplus" | "livefx" | "powerlive" = "2step") {
  const slug = f.slug;

  // =========================================================================
  // BULLFY (100% fiel al PDF public/bullfy_reglas_tipos_cuenta.pdf)
  // 3 productos: Bull One (1 fase) · Bull Prime (2 fases) · Bull Titan (Directo, 1 fase sin objetivo)
  // Drawdown siempre STATIC. DD total NO CAMBIA en cuenta fondeada. Reset 00:00 MT5 server timezone.
  // =========================================================================
  if (slug === "bullfy") {
    if (variant === "1step") {
      // BULL ONE · 1 fase = evaluación 12% / 5 días / 5% diario / 10% total static
      return [
        {
          name: "Bull One · Challenge 1-fase",
          order: 0,
          profit_target_pct: 12,
          max_daily_drawdown_pct: 5,
          max_total_drawdown_pct: 10,
          drawdown_type: "static" as const,
          min_trading_days: 5,
          reset_balance_on_new_phase: false,
          special_rules: ["strictest_floor_daily_vs_total", "dd_static_funded_same_rules", "scalping_10pct_warning", "inactivity_30d_close"],
        },
      ];
    }
    if (variant === "titan") {
      // BULL TITAN · Fondeo directo (sin evaluación, 3% día / 6% total / 3 días por retiro)
      return [
        {
          name: "Bull Titan · Fondeo Directo",
          order: 0,
          profit_target_pct: 0,
          max_daily_drawdown_pct: 3,
          max_total_drawdown_pct: 6,
          drawdown_type: "static" as const,
          min_trading_days: 3,
          reset_balance_on_new_phase: false,
          special_rules: ["profit_split_70", "strictest_floor_daily_vs_total", "scalping_10pct_warning", "inactivity_30d_close"],
        },
      ];
    }
    // BULL PRIME · 2-Step (8% / 3d) → (5% / 3d)
    return [
      {
        name: "Bull Prime · Fase 1 · Evaluación",
        order: 0,
        profit_target_pct: 8,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 3,
        reset_balance_on_new_phase: false,
        special_rules: ["strictest_floor_daily_vs_total", "dd_static_funded_same_rules"],
      },
      {
        name: "Bull Prime · Fase 2 · Verificación",
        order: 1,
        profit_target_pct: 5,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 3,
        reset_balance_on_new_phase: false,
        special_rules: ["strictest_floor_daily_vs_total", "dd_static_funded_same_rules"],
      },
    ];
  }

  // =========================================================================
  // FTMO (100% fiel al PDF public/ftmo_reglas_tipos_cuenta.pdf)
  // =========================================================================
  if (slug === "ftmo") {
    if (variant === "1step") {
      return [
        {
          name: "1-Step · Challenge",
          order: 0,
          profit_target_pct: 10,
          max_daily_drawdown_pct: 3,
          max_total_drawdown_pct: 10,
          drawdown_type: "trailing" as const,
          min_trading_days: 4,
          reset_balance_on_new_phase: false,
          special_rules: ["best_day_ratio_0_5_warning"],
        },
      ];
    }
    return [
      {
        name: "2-Step · Fase 1 · Challenge",
        order: 0,
        profit_target_pct: 10,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 4,
        reset_balance_on_new_phase: false,
        special_rules: [],
      },
      {
        name: "2-Step · Fase 2 · Verification",
        order: 1,
        profit_target_pct: 5,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 4,
        reset_balance_on_new_phase: true,
        special_rules: [],
      },
    ];
  }

  // =========================================================================
  // FX LIVE CAPITAL FOREX (100% fiel al PDF public/fxlivecapital_reglas_tipos_cuenta.pdf)
  // 3 productos: Boost+ (2-Step) · Live FX (1-Step) · Power Live (Fondeo Directo)
  // DD total sin confirmar públicamente = tratado como static por defecto
  // Holding fin de semana PERMITIDO en los 4 productos
  // =========================================================================
  if (slug === "fx-live-capital") {
    const commonFxlc = ["weekends_allowed", "dd_static_treat_by_default", "timezone_reset_tbd_confirm"] as const;
    if (variant === "boostplus") {
      // BOOST+ · 2 fases: 10% F1 / 8% F2 · 5% diario ambas · 10% total ambas · 3 mín / 90 máx días
      return [
        {
          name: "Boost+ · Fase 1 · Challenge",
          order: 0,
          profit_target_pct: 10,
          max_daily_drawdown_pct: 5,
          max_total_drawdown_pct: 10,
          drawdown_type: "static" as const,
          min_trading_days: 3,
          time_limit_days: 90,
          reset_balance_on_new_phase: false,
          special_rules: [...commonFxlc, "profit_split_90", "fee_refundable", "leverage_1_100"],
        },
        {
          name: "Boost+ · Fase 2 · Verification",
          order: 1,
          profit_target_pct: 8,
          max_daily_drawdown_pct: 5,
          max_total_drawdown_pct: 10,
          drawdown_type: "static" as const,
          min_trading_days: 3,
          time_limit_days: 90,
          reset_balance_on_new_phase: false,
          special_rules: [...commonFxlc, "profit_split_90", "fee_refundable", "leverage_1_100"],
        },
      ];
    }
    if (variant === "livefx") {
      // LIVE FX · 1 fase: 10% obj / 5% diario / 10% total · 3 mín / 90 máx días
      return [
        {
          name: "Live FX · 1-Step Challenge",
          order: 0,
          profit_target_pct: 10,
          max_daily_drawdown_pct: 5,
          max_total_drawdown_pct: 10,
          drawdown_type: "static" as const,
          min_trading_days: 3,
          time_limit_days: 90,
          reset_balance_on_new_phase: false,
          special_rules: [...commonFxlc, "profit_split_80", "fee_refundable", "leverage_1_100"],
        },
      ];
    }
    // POWER LIVE · Fondeo Directo (sin evaluación)
    // Daily DD = No especificado en documentación pública; Total DD 10%. 95% profit share, retiro DIARIO.
    return [
      {
        name: "Power Live · Fondeo Directo",
        order: 0,
        profit_target_pct: 0,
        max_daily_drawdown_pct: 10,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 3,
        reset_balance_on_new_phase: false,
        special_rules: ["direct_funding_no_challenge", "profit_split_95", "withdrawal_daily", "weekends_allowed", "leverage_1_100"],
      },
    ];
  }

  // =========================================================================
  // SYNTHETIC INDICES
  //   · Deriv (synthetic-deriv): reglas standard 10% / 5% / 10% · 4 días (sin PDF oficial aún)
  //   · FX Live Capital Synthetics (fx-live-capital-synthetic) = 10% / 4% diario / 8% total · 3d/90d + tope 10% mensual
  // =========================================================================
  if (slug === "fx-live-capital-synthetic") {
    return [
      {
        name: "Live Synthetics · 1-Step Challenge",
        order: 0,
        profit_target_pct: 10,
        max_daily_drawdown_pct: 4,
        max_total_drawdown_pct: 8,
        drawdown_type: "static" as const,
        min_trading_days: 3,
        time_limit_days: 90,
        reset_balance_on_new_phase: false,
        special_rules: [
          "scalping_unlimited", "24_7_trading", "weekends_allowed",
          "monthly_profit_cap_10_pct_synth",
          "leverage_1_50", "only_synthetics_assets",
          "profit_split_80", "fee_refundable",
        ],
      },
    ];
  }
  if (slug === "synthetic-deriv") {
    return [
      {
        name: "1-Step · Synthetic Challenge",
        order: 0,
        profit_target_pct: 10,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        drawdown_type: "static" as const,
        min_trading_days: 4,
        reset_balance_on_new_phase: false,
        special_rules: ["scalping_unlimited", "24_7_trading", "weekends_allowed"],
      },
    ];
  }

  // =========================================================================
  // Otras firmas: genéricas (mantener lo estimado previamente hasta que haya PDF)
  // =========================================================================
  const ddt = ["apex","topstep","lucid","the5ers"].includes(slug) ? "trailing" : "static";
  return [
    {
      name: size >= 100000 ? "Fase 1 · Challenge" : "Fase 1 - Evaluación",
      order: 0,
      profit_target_pct: size >= 200000 ? 8 : 10,
      max_daily_drawdown_pct: slug === "apex" ? 6 : 5,
      max_total_drawdown_pct: 10,
      drawdown_type: ddt as "static" | "trailing",
      min_trading_days: 4,
      reset_balance_on_new_phase: false,
      special_rules: [],
    },
    {
      name: "Fase 2 · Verification",
      order: 1,
      profit_target_pct: size >= 200000 ? 4 : 5,
      max_daily_drawdown_pct: slug === "apex" ? 6 : 5,
      max_total_drawdown_pct: ["the5ers","lucid"].includes(slug) ? 8 : 10,
      drawdown_type: ddt as "static" | "trailing",
      min_trading_days: 3,
      reset_balance_on_new_phase: true,
      special_rules: [],
    },
  ];
}

export const DEFAULT_PRESETS: FirmPreset[] = DEFAULT_FIRMS.flatMap((f) => {
  const forex = f.market === "forex";
  const synth = f.market === "synthetic_indices";
  const sizes = f.slug === "bullfy" ? SIZES_BULLFY : SIZES;

  // ── FX LIVE CAPITAL · SYNTHETIC INDICES · 5 tamaños 5K-50K PDF ──
  if (f.slug === "fx-live-capital-synthetic") {
    return SIZES_FXLC_SYNTH.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Live Synthetics`,
      slug: `${sz}-challenge-live-synthetics`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: false,
      allow_news_trade_lock: false,
      is_active: true,
      order_index: 400 + i + 1,
      phases: buildPhasesFor(f, sz, "1step"),
      created_at: now,
      updated_at: now,
    } satisfies FirmPreset));
  }

  // ── Synthetic Indices (Deriv standard sin PDF oficial aún) · 5 tamaños standard ──
  if (f.slug === "synthetic-deriv") {
    return SIZES.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Synthetic 1-Step`,
      slug: `${sz}-challenge-synthetic`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: false,
      allow_news_trade_lock: false,
      is_active: true,
      order_index: 300 + i + 1,
      phases: buildPhasesFor(f, sz, "1step"),
      created_at: now,
      updated_at: now,
    } satisfies FirmPreset));
  }

  // ── FX LIVE CAPITAL · FOREX · 3 productos PDF oficiales ──
  if (f.slug === "fx-live-capital") {
    // Boost+ · 2-Step · 5 tamaños: 7.5K / 13.5K / 22.5K / 37.5K / 75K (página 5 del PDF)
    const boostPlus: FirmPreset[] = SIZES_FXLC_BOOSTPLUS.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Boost+`,
      slug: `${sz}-challenge-boostplus`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: i + 1,
      phases: buildPhasesFor(f, sz, "boostplus"),
      created_at: now,
      updated_at: now,
    }));
    // Live FX · 1-Step · 5 tamaños: 5K / 10K / 25K / 50K / 100K (PDF: min 5K, máx 100K)
    const liveFx: FirmPreset[] = SIZES_FXLC_LIVEFX.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}-livefx`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Live FX`,
      slug: `${sz}-challenge-livefx`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: 100 + i + 1,
      phases: buildPhasesFor(f, sz, "livefx"),
      created_at: now,
      updated_at: now,
    }));
    // Power Live · Fondeo Directo · 5 tamaños: 500 / 5K / 10K / 25K / 50K (PDF: min 500, máx 50K)
    const powerLive: FirmPreset[] = SIZES_FXLC_POWERLIVE.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}-power`,
      firm_id: f.id,
      name: sz < 1000
        ? `$${sz} · Power Live (Directo)`
        : `$${(sz/1000).toFixed(0)}K · Power Live (Directo)`,
      slug: `${sz}-challenge-powerlive`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: 200 + i + 1,
      phases: buildPhasesFor(f, sz, "powerlive"),
      created_at: now,
      updated_at: now,
    }));
    return [...boostPlus, ...liveFx, ...powerLive];
  }

  if (f.slug === "bullfy") {
    // 3 productos × 6 tamaños = 18 presets oficiales (PDF página 7)
    //   variant 2step  = Bull Prime 2-fases
    //   variant 1step  = Bull One 1-fase
    //   variant titan  = Bull Titan Fondeo Directo
    const prime: FirmPreset[] = sizes.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Bull Prime`,
      slug: `${sz}-challenge-prime`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: i + 1,
      phases: buildPhasesFor(f, sz, "2step"),
      created_at: now,
      updated_at: now,
    }));
    const one: FirmPreset[] = sizes.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}-one`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Bull One`,
      slug: `${sz}-challenge-one`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: 100 + i + 1,
      phases: buildPhasesFor(f, sz, "1step"),
      created_at: now,
      updated_at: now,
    }));
    const titan: FirmPreset[] = sizes.map((sz, i) => ({
      id: `${f.id}-preset-${padBal6(sz)}-titan`,
      firm_id: f.id,
      name: `$${(sz/1000).toFixed(0)}K · Bull Titan (Fondeo Directo)`,
      slug: `${sz}-challenge-titan`,
      initial_balance: sz,
      currency: "USD",
      broker_timezone: "Etc/UTC",
      daily_reset_hour_utc: 0,
      allow_consistency_rule: false,
      allow_newstrade_lock: true,
      allow_news_trade_lock: true,
      is_active: true,
      order_index: 200 + i + 1,
      phases: buildPhasesFor(f, sz, "titan"),
      created_at: now,
      updated_at: now,
    }));
    return [...prime, ...one, ...titan];
  }

  const twoStep: FirmPreset[] = sizes.map((size, i) => {
    const phases = buildPhasesFor(f, size, "2step");
    return {
      id: `${f.id}-preset-${padBal6(size)}`,
      firm_id: f.id,
      name: `$${size >= 1000 ? (size / 1000).toFixed(0) + "K" : String(size)}${f.slug === "ftmo" ? " 2-Step" : ""}`,
      slug: `${size}-challenge`,
      initial_balance: size,
      currency: "USD",
      broker_timezone: forex ? "UTC" : "America/Chicago",
      daily_reset_hour_utc: forex ? 0 : 23,
      allow_consistency_rule: f.slug === "ftmo" ? true : false,
      allow_newstrade_lock: false,
      allow_news_trade_lock: false,
      is_active: true,
      order_index: i + 1,
      phases,
      created_at: now,
      updated_at: now,
    } satisfies FirmPreset;
  });

  if (f.slug === "ftmo") {
    // Extra presets 1-Step (5 adicionales) → 10 total
    const oneStep: FirmPreset[] = SIZES.map((size, i) => ({
      id: `${f.id}-preset-${padBal6(size)}-1step`,
      firm_id: f.id,
      name: `$${size >= 1000 ? (size / 1000).toFixed(0) + "K" : String(size)} 1-Step`,
      slug: `${size}-challenge-1step`,
      initial_balance: size,
      currency: "USD",
      broker_timezone: forex ? "UTC" : "America/Chicago",
      daily_reset_hour_utc: forex ? 0 : 23,
      allow_consistency_rule: true,
      allow_newstrade_lock: false,
      allow_news_trade_lock: false,
      is_active: true,
      order_index: 100 + i + 1,
      phases: buildPhasesFor(f, size, "1step"),
      created_at: now,
      updated_at: now,
    }));
    return [...twoStep, ...oneStep];
  }
  return twoStep;
});

// =========================================================================
// Helpers públicos (wrappers sobre los arrays estáticos)
// =========================================================================

export function getFirmsByMarket(market: MarketType): Firm[] {
  return DEFAULT_FIRMS.filter((f) => f.market === market && f.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

export function getPresetsByFirm(firmId: string): FirmPreset[] {
  return DEFAULT_PRESETS.filter((p) => p.firm_id === firmId && p.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

export function getFirmById(id: string): Firm | undefined {
  return DEFAULT_FIRMS.find((f) => f.id === id);
}

export function getPresetById(id: string): FirmPreset | undefined {
  return DEFAULT_PRESETS.find((p) => p.id === id);
}

export function getFirmBySlug(slug: string): Firm | undefined {
  return DEFAULT_FIRMS.find((f) => f.slug === slug);
}
