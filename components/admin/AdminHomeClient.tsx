"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Crown, PlusCircle, Wallet, ChevronRight,
  ToggleLeft, ToggleRight, Edit3, Trash2, Save, XCircle, Eye, EyeOff
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import {
  createFirmAction,
  updateFirmMetaAction,
  deleteFirmAction,
} from "@/lib/admin/actions";
import type { Firm, FirmPreset, MarketType } from "@/lib/types";
import { DEFAULT_FIRMS, getPresetsByFirm, getFirmsByMarket } from "@/lib/data/seed";

function initials(name: string) {
  return name.split(/[\s·\-]/).filter(Boolean).slice(0,2).map(w => (w[0] || "").toUpperCase()).join("") || "?";
}

function FirmLogoThumb({ firm }: { firm: Firm }) {
  const [imgErr, setImgErr] = React.useState(false);
  const showImg = !!firm.logo_url && !imgErr;
  return (
    <div
      className={cn(
        "w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center overflow-hidden",
        showImg
          ? "bg-white border-white/10 p-1.5"
          : "bg-gradient-to-br from-gold-400/20 to-gold-600/5 border-gold-500/20 shadow-gold/30"
      )}
    >
      {showImg ? (
        <img
          src={firm.logo_url!}
          alt={firm.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-contain"
        />
      ) : firm.logo_url && imgErr ? (
        <span className="text-[11px] font-bold text-gold-300 tracking-widest">
          {initials(firm.name)}
        </span>
      ) : (
        <Building2 className="w-5 h-5 text-gold-300" />
      )}
    </div>
  );
}

function useServer(fn: (a?: any) => Promise<any>) {
  const [pending, setPending] = React.useState(false);
  const run = async (a?: any) => {
    if (pending) return false;
    setPending(true);
    try { await fn(a); return true; }
    catch (e: any) { toast.error(e?.message || "Error"); return false; }
    finally { setPending(false); }
  };
  return { pending, run };
}

export default function AdminHomeClient({
  user,
  isAdmin,
  realFirms,
  realPresets,
}: {
  user: any;
  isAdmin: boolean;
  realFirms: Firm[];
  realPresets: FirmPreset[];
}) {
  const router = useRouter();

  const firms: Firm[] = realFirms.length > 0
    ? realFirms.slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : DEFAULT_FIRMS.slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const presets = (firmId: string) => {
    const fromReal = realPresets.filter((p) => p.firm_id === firmId);
    if (fromReal.length) return fromReal;
    return getPresetsByFirm(firmId);
  };

  const firmsCount = firms.length;
  const presetsCount = realPresets.length > 0 ? realPresets.length : (DEFAULT_FIRMS.length * 5);
  const forexCount = realFirms.length ? firms.filter((f) => f.market === "forex").length : getFirmsByMarket("forex").length;
  const futuresCount = realFirms.length ? firms.filter((f) => f.market === "futures").length : getFirmsByMarket("futures").length;
  const cryptoCount = realFirms.length ? firms.filter((f) => f.market === "crypto").length : getFirmsByMarket("crypto").length;
  const syntheticCount = realFirms.length ? firms.filter((f) => f.market === "synthetic_indices").length : getFirmsByMarket("synthetic_indices").length;

  const [showCreate, setShowCreate] = React.useState(false);
  const [editingFirmId, setEditingFirmId] = React.useState<string | null>(null);
  const [firmDraft, setFirmDraft] = React.useState<Record<string, string | boolean | number>>({});

  const delFirm = useServer(async (firm: Firm) => {
    if (!confirm(`¿Borrar ${firm.name}? Primero borra todos sus presets y desafíos.`)) return;
    if (await deleteFirmAction(firm.id)) {
      toast.success("Firma eliminada");
      router.refresh();
    }
  });

  const toggleActive = useServer(async (f: Firm) => {
    if (await updateFirmMetaAction(f.id, { is_active: !f.is_active })) {
      toast.success(f.is_active ? "Firma desactivada" : "Firma activada");
      router.refresh();
    }
  });

  const saveDraft = useServer(async (f: Firm) => {
    const patch: any = {};
    const allowed = ["name", "description", "website_url", "logo_url", "order_index"];
    allowed.forEach((k) => { if (k in firmDraft) patch[k] = firmDraft[k]; });
    if ("is_featured" in firmDraft) patch.is_featured = !!firmDraft.is_featured;
    if (Object.keys(patch).length === 0) { setEditingFirmId(null); return; }
    if (await updateFirmMetaAction(f.id, patch)) {
      setFirmDraft({});
      setEditingFirmId(null);
      toast.success("Firma guardada");
      router.refresh();
    }
  });

  const [newFirm, setNewFirm] = React.useState({ name: "", slug: "", market: "forex" as MarketType });
  const createFirm = useServer(async () => {
    if (!newFirm.name.trim() || !newFirm.slug.trim()) return toast.error("Nombre y slug obligatorios");
    const res = await createFirmAction({ ...newFirm, name: newFirm.name.trim(), slug: newFirm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") });
    if (res?.ok) {
      toast.success("Firma creada");
      setShowCreate(false);
      setNewFirm({ name: "", slug: "", market: "forex" });
      router.push(`/admin/firms/${res.id}`);
    }
  });

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-[1500px] mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 mb-4">
            <Crown className="w-3.5 h-3.5 text-gold-300"/>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-200">Panel de administración</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">
            Firmas & <span className="gold-gradient-text">Presets</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Gestiona las firmas prop soportadas y sus presets de reglas. Cualquier
            cambio se aplica en tiempo real a todos los desafíos activos de esa firma.
            {realFirms.length === 0 && <span className="block mt-2 text-amber-300">⚠ Leyendo seed local (0 firmas en Supabase). Crea la primera desde el botón superior derecho.</span>}
          </p>
          <div className="text-xs text-muted-foreground mt-3">
            Usuario: <span className="text-foreground font-medium">{user.email}</span>
            {user.full_name && ` · ${user.full_name}`}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowCreate(true)} disabled={!isAdmin} className="btn-gold !px-6 text-sm">
            <PlusCircle className="w-4 h-4"/> Nueva firma
          </button>
        </div>
      </header>

      {!isAdmin && (
        <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-300"/>
          </div>
          <div>
            <div className="font-semibold text-amber-200">Modo demostración</div>
            <div className="text-sm text-muted-foreground">
              Estás viendo una vista previa del panel admin. Para editar firmas y
              presets en producción, tu usuario (user_id en Supabase) debe tener
              <code className="mx-1 px-1.5 py-0.5 rounded bg-black/40 text-xs text-amber-200">profiles.is_admin = true</code>.
              <br/>
              SQL para hacer admin: <code className="mx-1 px-1.5 py-0.5 rounded bg-black/40 text-xs text-amber-200">UPDATE public.profiles SET is_admin = true WHERE email = '{user.email}';</code>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="glass-card-strong gold-gradient-border p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-display text-2xl mb-1">Crear nueva firma prop</div>
              <div className="text-sm text-muted-foreground">Los presets 10K/25K/50K/100K/200K los crearás desde el detalle.</div>
            </div>
            <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-white/[0.05] text-muted-foreground"><XCircle className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Nombre de la firma" value={newFirm.name} onChange={(v) => setNewFirm({ ...newFirm, name: v })} placeholder="Mi Prop Firm SA" />
            <Field label="Slug URL" value={newFirm.slug} onChange={(v) => setNewFirm({ ...newFirm, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="mi-prop-firm" />
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Mercado</label>
              <select value={newFirm.market} onChange={(e) => setNewFirm({ ...newFirm, market: e.target.value as MarketType })} className="input-gold w-full">
                <option value="forex">Forex</option>
                <option value="futures">Futuros</option>
                <option value="crypto">Cripto</option>
                <option value="synthetic_indices">Índices Sintéticos</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={async () => await createFirm.run()} disabled={createFirm.pending || !newFirm.name || !newFirm.slug} className="btn-gold w-full !py-3 !text-sm">
                {createFirm.pending ? "Creando..." : "Crear firma + ir a presets"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard label="Firmas cargadas" value={String(firmsCount)} icon={Building2} accent="gold" />
        <StatCard label="Presets de cuenta" value={String(presetsCount)} icon={Wallet} accent="emerald" />
        <StatCard label="Firmas Forex" value={String(forexCount)} icon={Building2} accent="sky" />
        <StatCard label="Firmas Futuros" value={String(futuresCount)} icon={Building2} accent="violet" />
        <StatCard label="Firmas Cripto" value={String(cryptoCount)} icon={Building2} accent="amber" />
        <StatCard label="Sintéticas" value={String(syntheticCount)} icon={Building2} accent="fuchsia" />
      </div>

      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold">Todas las firmas ({firms.length})</h2>
            <p className="text-sm text-muted-foreground">Activas en el MVP. Clica "Presets" para editar sus reglas y fases.</p>
          </div>
        </div>

        <div className="glass-card !p-0 overflow-hidden">
          <div className="grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.05] text-[10px] uppercase tracking-widest text-muted-foreground/80">
            <div className="md:col-span-4">Firma</div>
            <div className="md:col-span-1">Mercado</div>
            <div className="md:col-span-2">Presets</div>
            <div className="md:col-span-2">Estado</div>
            <div className="md:col-span-3 text-right">Acciones</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {firms.map((f) => {
              const ps = presets(f.id);
              const beingEdited = editingFirmId === f.id;
              return (
                <div key={f.id} className="grid md:grid-cols-12 gap-4 px-6 py-5 items-start md:items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="md:col-span-4 flex items-start gap-3">
                    <FirmLogoThumb firm={f} />
                    <div className="min-w-0 flex-1 space-y-2">
                      {beingEdited ? (
                        <>
                          <input
                            defaultValue={f.name}
                            onChange={(e) => setFirmDraft({ ...firmDraft, name: e.target.value })}
                            className="input-gold !py-1.5 w-full font-semibold"
                          />
                          <textarea
                            rows={2}
                            defaultValue={f.description || ""}
                            onChange={(e) => setFirmDraft({ ...firmDraft, description: e.target.value })}
                            className="input-gold !py-1.5 w-full text-xs"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input defaultValue={f.website_url || ""} onChange={(e) => setFirmDraft({ ...firmDraft, website_url: e.target.value })} placeholder="Website" className="input-gold !py-1 text-xs" />
                            <input defaultValue={String(f.order_index || 0)} onChange={(e) => setFirmDraft({ ...firmDraft, order_index: Number(e.target.value) })} placeholder="order_index" className="input-gold !py-1 text-xs" type="number" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold truncate">{f.name}</div>
                            {f.is_featured && <span className="chip-gold !py-0 !text-[9px]"><Crown className="w-2.5 h-2.5" /> Destacada</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">{f.description || `${f.market.toUpperCase()} · ${f.slug}`}</div>
                          {f.website_url && <a href={f.website_url} target="_blank" rel="noreferrer" className="text-[11px] text-gold-300 hover:text-gold-200 truncate block">{f.website_url}</a>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border",
                      f.market === "forex" ? "bg-sky-500/10 text-sky-300 border-sky-400/20"
                        : f.market === "futures" ? "bg-violet-500/10 text-violet-300 border-violet-400/20"
                        : f.market === "synthetic_indices" ? "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20"
                        : "bg-amber-500/10 text-amber-300 border-amber-400/20"
                    )}>
                      {f.market}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-1.5">
                      {ps.slice(0, 4).map((p) => (
                        <span key={p.id} className={cn("text-[10px] px-2 py-0.5 rounded-md border",
                          p.is_active ? "bg-white/[0.04] border-white/[0.05]" : "bg-rose-500/5 border-rose-500/10 text-rose-300/70 line-through")}>
                          {p.name}
                        </span>
                      ))}
                      {ps.length > 4 && (
                        <span className="text-[10px] text-gold-300 font-semibold">+{ps.length - 4}</span>
                      )}
                      {ps.length === 0 && <span className="text-[10px] text-muted-foreground/60">Sin presets →</span>}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    {beingEdited ? (
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-white/[0.03] cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          defaultChecked={!!f.is_featured}
                          onChange={(e) => setFirmDraft({ ...firmDraft, is_featured: e.target.checked })}
                          className="accent-gold-500"
                        />
                        Destacada
                      </label>
                    ) : f.is_active ? (
                      <button onClick={async () => await toggleActive.run(f)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 hover:bg-emerald-500/15">
                        <ToggleRight className="w-3.5 h-3.5"/> Activa
                      </button>
                    ) : (
                      <button onClick={async () => await toggleActive.run(f)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.04] text-muted-foreground border border-white/10 hover:bg-white/[0.08]">
                        <ToggleLeft className="w-3.5 h-3.5"/> Inactiva
                      </button>
                    )}
                  </div>
                  <div className="md:col-span-3 flex items-center justify-end gap-2 flex-wrap">
                    <Link
                      href={`/admin/firms/${f.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                                 bg-white/[0.03] border border-white/[0.06] hover:border-gold-500/30 hover:text-gold-200 transition-all"
                    >
                      Presets <ChevronRight className="w-3.5 h-3.5"/>
                    </Link>
                    {beingEdited ? (
                      <>
                        <button onClick={async () => await saveDraft.run(f)} disabled={saveDraft.pending || !isAdmin} className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-300 hover:bg-gold-500/20" title="Guardar firma"><Save className="w-4 h-4"/></button>
                        <button onClick={() => { setEditingFirmId(null); setFirmDraft({}); }} className="p-2 rounded-lg hover:bg-white/[0.05] text-muted-foreground"><XCircle className="w-4 h-4"/></button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingFirmId(beingEdited ? null : f.id)}
                          disabled={!isAdmin}
                          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:border-gold-500/30 hover:text-gold-200 transition-all disabled:opacity-40"
                          title="Editar firma"
                        ><Edit3 className="w-4 h-4"/></button>
                        <button
                          onClick={() => toggleActive.run(f).then()}
                          disabled={!isAdmin}
                          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:border-sky-500/30 hover:text-sky-200 transition-all disabled:opacity-40"
                          title={f.is_active ? "Ocultar" : "Mostrar"}
                        >{f.is_active ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}</button>
                        <button
                          onClick={async () => await delFirm.run(f)}
                          disabled={!isAdmin || delFirm.pending}
                          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:border-rose-500/30 hover:text-rose-300 transition-all disabled:opacity-40"
                          title="Eliminar firma"
                        ><Trash2 className="w-4 h-4"/></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {firms.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex items-center gap-2 mb-4 text-muted-foreground">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="font-semibold mb-1">Aún no tienes firmas</div>
                <div className="text-sm text-muted-foreground mb-4">Crea la primera haciendo clic arriba en <span className="text-gold-300">"Nueva firma"</span>.</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-4 gap-5">
        {(["forex", "futures", "crypto", "synthetic_indices"] as const).map((m) => {
          const firmsM = firms.filter((f) => f.market === m).slice(0, 2);
          const marketLabel = m === "forex" ? "Forex" : m === "futures" ? "Futuros" : m === "crypto" ? "Cripto" : "Índices Sintéticos";
          return (
            <div key={m} className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ejemplo presets</div>
                  <h3 className="font-display text-xl font-semibold capitalize">{marketLabel}</h3>
                </div>
                <Link href={`/admin/firms/new?market=${m}`} className="text-xs text-gold-300 hover:text-gold-200 inline-flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5"/> Nuevo preset
                </Link>
              </div>
              <div className="space-y-3">
                {firmsM.map((f) => {
                  const firmPs = presets(f.id);
                  const topPreset = firmPs.find((p) => p.initial_balance >= 50000) || firmPs[0];
                  if (!topPreset) return null;
                  return (
                    <div key={f.id} className="rounded-xl p-4 border border-white/[0.05] bg-white/[0.02] hover:border-gold-500/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold flex items-center gap-2">
                          {f.name} <span className="chip-gold !py-0 !text-[9px]">{topPreset.name}</span>
                        </div>
                        <div className="text-sm font-semibold gold-gradient-text">{formatCurrency(topPreset.initial_balance)}</div>
                      </div>
                      {(topPreset.phases as any[] || []).map((ph) => (
                        <div key={ph.order} className="grid grid-cols-4 gap-2 text-[11px] py-2 border-t border-white/[0.04]">
                          <div className="text-muted-foreground truncate">{ph.name}</div>
                          <div className="text-right">Obj. <span className="text-foreground font-medium">{ph.profit_target_pct}%</span></div>
                          <div className="text-right">DD día <span className="text-foreground font-medium">{ph.max_daily_drawdown_pct}%</span></div>
                          <div className="text-right">DD máx <span className="text-foreground font-medium">{ph.max_total_drawdown_pct}%</span></div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {firmsM.length === 0 && (
                  <div className="rounded-xl p-6 border border-dashed border-white/10 text-center text-sm text-muted-foreground">
                    Sin firmas de {marketLabel} en BD.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-gold w-full" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent: string }) {
  const bgs: Record<string, string> = {
    gold: "from-gold-400/20 to-gold-600/5 border-gold-500/20",
    emerald: "from-emerald-400/20 to-emerald-600/5 border-emerald-400/20",
    sky: "from-sky-400/20 to-sky-600/5 border-sky-400/20",
    violet: "from-violet-400/20 to-violet-600/5 border-violet-400/20",
    amber: "from-amber-400/20 to-amber-600/5 border-amber-400/20",
    fuchsia: "from-fuchsia-400/20 to-purple-600/5 border-fuchsia-400/20",
  };
  const texts: Record<string, string> = {
    gold: "text-gold-300", emerald: "text-emerald-300", sky: "text-sky-300", violet: "text-violet-300", amber: "text-amber-300", fuchsia: "text-fuchsia-300",
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">{label}</div>
          <div className="font-display text-3xl font-bold">{value}</div>
        </div>
        <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br", bgs[accent])}>
          <Icon className={cn("w-5 h-5", texts[accent])}/>
        </div>
      </div>
    </div>
  );
}
