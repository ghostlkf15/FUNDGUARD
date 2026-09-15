"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, ChevronLeft, Edit3, Trash2, PlusCircle, Save, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import {
  createPresetAction,
  updatePresetNameAction,
  updatePresetActiveAction,
  updatePresetOrderAction,
  updatePresetPhaseAction,
  deletePresetAction,
  resetFirmPresetsStandardAction,
} from "@/lib/admin/actions";
import { cn, formatCurrency } from "@/lib/utils";
import type { Firm, FirmPreset } from "@/lib/types";
import { toast } from "@/components/ui/sonner";
import { FirmLogo } from "@/components/ui/firm-logo";

function useServer(action: (form?: FormData | any) => Promise<any>) {
  const [pending, setPending] = React.useState(false);
  const run = async (arg?: any) => {
    if (pending) return;
    setPending(true);
    try { await action(arg); return true; }
    catch (e: any) { toast.error(e?.message || "Error"); return false; }
    finally { setPending(false); }
  };
  return { pending, run };
}

export default function FirmDetailAdminClient({
  firm,
  initialPresets,
}: {
  firm: Firm;
  initialPresets: FirmPreset[];
}) {
  const router = useRouter();
  const [presets, setPresets] = React.useState<FirmPreset[]>(
    (initialPresets || []).slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  );

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);
  const [draftSize, setDraftSize] = React.useState(100000);

  const renameAct = useServer(async (form: FormData) => {
    const id = String(form.get("presetId") || "");
    const name = String(form.get("name") || "").trim();
    if (!id || !name) return;
    const ok = await updatePresetNameAction(id, name);
    if (ok) {
      setPresets((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
      setEditingId(null);
      toast.success("Preset renombrado");
    }
  });

  const toggleAct = useServer(async ({ id, active }: { id: string; active: boolean }) => {
    const ok = await updatePresetActiveAction(id, active);
    if (ok) {
      setPresets((p) => p.map((x) => (x.id === id ? { ...x, is_active: active } : x)));
      toast.success(active ? "Preset activado" : "Preset desactivado");
    }
  });

  const orderAct = useServer(async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
    const idx = presets.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const swap = presets[idx + dir];
    if (!swap) return;
    setPresets((p) => {
      const arr = p.slice();
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr.map((x, i) => ({ ...x, order_index: i + 1 }));
    });
    const arr = [
      updatePresetOrderAction(id, (presets[idx].order_index || 0) + dir),
      updatePresetOrderAction(swap.id, (swap.order_index || 0) - dir),
    ];
    await Promise.all(arr);
    router.refresh();
  });

  const delAct = useServer(async (id: string) => {
    if (!confirm("¿Borrar preset? Esta acción no se puede deshacer.")) return;
    const ok = await deletePresetAction(id);
    if (ok) {
      setPresets((p) => p.filter((x) => x.id !== id));
      toast.success("Preset eliminado");
    }
  });

  const createAct = useServer(async () => {
    const ok = await createPresetAction({ firm_id: firm.id, initial_balance: draftSize, name: `$${(draftSize / 1000).toFixed(0)}K` });
    if (ok) {
      toast.success("Preset creado");
      setShowCreate(false);
      router.refresh();
    }
  });

  const resetAct = useServer(async () => {
    if (!confirm(
      "Restablecer los presets estándar desde el PDF?\n\n" +
      "Se eliminarán TODOS los presets actuales de esta firma y se volverán a crear los presets oficiales del PDF.\n\n" +
      "ATENCIÓN: La operación es SEGURA, se ABORTARÁ automáticamente si la firma tiene desafíos asociados en la BD."
    )) return;
    const ok = await resetFirmPresetsStandardAction(firm.id);
    if (ok) {
      toast.success("Presets oficiales PDF restaurados");
      router.refresh();
    }
  });

  const hasOfficialPdf = ["ftmo","bullfy","fx-live-capital","fx-live-capital-synthetic"].includes(firm.slug);
  const pdfPath = firm.slug === "bullfy"
    ? "/public/bullfy_reglas_tipos_cuenta.pdf"
    : firm.slug === "fx-live-capital" || firm.slug === "fx-live-capital-synthetic"
    ? "/public/fxlivecapital_reglas_tipos_cuenta.pdf"
    : "/public/ftmo_reglas_tipos_cuenta.pdf";

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold-300 mb-2">
        <ChevronLeft className="w-4 h-4" /> Volver a firmas
      </Link>

      <div className="glass-card-strong gold-gradient-border p-6 md:p-8 flex items-start gap-5 flex-wrap">
        <FirmLogo firm={firm} size="xl" className="shadow-gold" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">{firm.name}</h1>
            <span className="chip-gold !py-0 !uppercase !text-[10px]">{firm.market}</span>
            {firm.is_active && <span className="chip !bg-emerald-500/10 !text-emerald-300 !border-emerald-400/20 !py-0 !text-[10px]">ACTIVA</span>}
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {firm.description || `Presets oficiales de ${firm.name}. Cualquier edición aplica en tiempo real a desafíos activos.`}
          </p>
          {firm.website_url && <a href={firm.website_url} target="_blank" rel="noreferrer" className="text-xs text-gold-300 hover:text-gold-200">{firm.website_url}</a>}
        </div>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Presets ({presets.length})</h2>
          <p className="text-sm text-muted-foreground">Reordena, renombra, activa o edita sus fases.
            {hasOfficialPdf && <span className="block text-gold-300/80 mt-1">📘 Reglas extraídas 100% fieles de <code className="mx-1 px-1.5 py-0.5 rounded bg-black/40 text-[11px]">{pdfPath}</code></span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasOfficialPdf && (
            <button
              onClick={async () => await resetAct.run()}
              disabled={resetAct.pending}
              className="btn-ghost-gold !py-2 text-sm border-gold-500/40"
              title="Vuelve a regenerar TODOS los presets desde el PDF oficial (safe: aborta si hay desafíos asociados)"
            >
              <Crown className="w-4 h-4" />
              {resetAct.pending ? "Restaurando..." : "🔄 Reset reglas PDF oficial"}
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-gold !py-2 text-sm">
            <PlusCircle className="w-4 h-4" /> Nuevo preset
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="glass-card p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-semibold mb-1">Crear nuevo preset</div>
              <p className="text-xs text-muted-foreground">Se crearán automáticamente las 2 fases standard.</p>
            </div>
            <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-white/[0.05] text-muted-foreground">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Tamaño de cuenta (USD)</label>
              <select value={draftSize} onChange={(e) => setDraftSize(Number(e.target.value))} className="input-gold w-full">
                {[10000, 25000, 50000, 100000, 150000, 200000, 300000, 500000].map((s) => (
                  <option key={s} value={s}>${formatCurrency(s)}</option>
                ))}
              </select>
            </div>
            <button onClick={async () => await createAct.run()} disabled={createAct.pending} className="btn-gold !py-3 !text-sm">
              {createAct.pending ? "Creando..." : "Crear preset"}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {presets.map((p, i) => {
          const beingEdited = editingId === p.id;
          return (
            <div key={p.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  {beingEdited ? (
                    <form action={renameAct.run as any} className="flex items-center gap-2">
                      <input type="hidden" name="presetId" value={p.id} />
                      <input
                        name="name"
                        defaultValue={p.name}
                        autoFocus
                        onKeyDown={(e) => { setDraftName(e.currentTarget.value); if (e.key === "Escape") setEditingId(null); }}
                        onChange={(e) => setDraftName(e.currentTarget.value)}
                        className="input-gold !py-1.5 !text-lg font-display font-bold gold-gradient-text"
                      />
                      <button type="submit" className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-300 hover:bg-gold-500/20" title="Guardar"><Save className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setEditingId(null)} className="p-2 rounded-lg hover:bg-white/[0.05] text-muted-foreground"><XCircle className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Preset · #{String(i + 1).padStart(2, "0")}</div>
                      <div className="font-display text-2xl gold-gradient-text font-bold">{p.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">Balance inicial ${p.initial_balance.toLocaleString()} · {p.currency}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={async () => await orderAct.run({ id: p.id, dir: -1 })} disabled={i === 0 || orderAct.pending} title="Mover arriba"><ChevronUp className={cn("w-4 h-4", i === 0 ? "text-muted-foreground/30" : "hover:text-gold-300")} /></button>
                  <button onClick={async () => await orderAct.run({ id: p.id, dir: 1 })} disabled={i === presets.length - 1 || orderAct.pending} title="Mover abajo"><ChevronDown className={cn("w-4 h-4", i === presets.length - 1 ? "text-muted-foreground/30" : "hover:text-gold-300")} /></button>
                  <button
                    onClick={() => setEditingId(beingEdited ? null : p.id)}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:border-gold-500/30 hover:text-gold-200 transition-all" title="Renombrar"
                  ><Edit3 className="w-4 h-4" /></button>
                  <button
                    onClick={async () => await toggleAct.run({ id: p.id, active: !p.is_active })}
                    className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg border",
                      p.is_active ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" : "bg-white/[0.04] text-muted-foreground border-white/10")}
                    title="Toggle activo"
                  >
                    {p.is_active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={async () => await delAct.run(p.id)}
                    disabled={delAct.pending}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:border-rose-500/30 hover:text-rose-300 transition-all"
                    title="Eliminar"
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <PhaseEditor preset={p} />

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Crown className="w-3.5 h-3.5 text-gold-400" />
                Reset diario a las {String(p.daily_reset_hour_utc ?? 0).padStart(2, "0")}:00 UTC · {p.broker_timezone}
                {!p.is_active && <span className="ml-auto text-amber-300">⚠ Este preset NO se muestra en el wizard de nuevo desafío.</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseEditor({ preset }: { preset: FirmPreset }) {
  const router = useRouter();
  const phases = (preset.phases || []) as any[];
  const [patch, setPatch] = React.useState<Record<string, any>>({});
  const [saving, setSaving] = React.useState<string | null>(null);

  const cur = (phaseIdx: number, key: string) => {
    const k = `${phaseIdx}-${key}`;
    if (k in patch) return patch[k];
    return (phases[phaseIdx] as any)?.[key];
  };

  const set = (phaseIdx: number, key: string, v: any) => {
    setPatch((p) => ({ ...p, [`${phaseIdx}-${key}`]: v }));
  };

  const savePhase = async (idx: number) => {
    const keys = ["name", "profit_target_pct", "max_daily_drawdown_pct", "max_total_drawdown_pct", "drawdown_type", "min_trading_days", "time_limit_days", "reset_balance_on_new_phase", "special_rules"];
    const obj: any = {};
    keys.forEach((k) => {
      const patched = patch[`${idx}-${k}`];
      if (patched !== undefined) {
        if (k.includes("pct") || k === "min_trading_days" || k === "time_limit_days") obj[k] = patched === "" ? null : Number(patched);
        else if (k === "reset_balance_on_new_phase") obj[k] = !!patched;
        else if (k === "special_rules") {
          const arr = String(patched)
            .split(/[,;\s]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          obj[k] = arr;
        }
        else obj[k] = patched;
      }
    });
    if (Object.keys(obj).length === 0) return;
    setSaving(String(idx));
    try {
      await updatePresetPhaseAction(preset.id, idx, obj);
      toast.success(`Fase ${idx + 1} guardada`);
      setPatch({});
      router.refresh();
    } catch (e: any) { toast.error(e?.message || "Error guardando fase"); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-3">
      {phases.map((ph: any, i: number) => {
        const key = (k: string) => `${i}-${k}`;
        const dirty = Object.keys(patch).some((k) => k.startsWith(`${i}-`));
        return (
          <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-[10px] w-6 h-6 rounded-lg bg-white/[0.05] flex items-center justify-center">{i + 1}</span>
                <input
                  value={cur(i, "name")}
                  onChange={(e) => set(i, "name", e.target.value)}
                  className="bg-transparent border-b border-white/10 focus:border-gold-500/50 outline-none py-0.5 font-semibold"
                />
                <span className="text-[10px] uppercase tracking-widest text-gold-300/80 bg-gold-500/5 px-2 py-0.5 rounded-full border border-gold-500/15">
                  <select
                    value={cur(i, "drawdown_type") || "static"}
                    onChange={(e) => set(i, "drawdown_type", e.target.value)}
                    className="bg-transparent outline-none text-[10px] uppercase tracking-widest text-gold-300/80"
                  >
                    <option value="static">static</option>
                    <option value="trailing">trailing</option>
                  </select>
                </span>
              </div>
              <button
                onClick={() => savePhase(i)}
                disabled={!dirty || saving === String(i)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
                  !dirty
                    ? "bg-white/[0.03] text-muted-foreground border-white/[0.08]"
                    : "bg-gold-500/10 text-gold-300 border-gold-500/30 hover:bg-gold-500/20"
                )}
              >
                {saving === String(i) ? "Guardando..." : dirty ? <><Save className="w-3 h-3" /> Guardar fase</> : "Sin cambios"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <Field k="Objetivo %" v={cur(i, "profit_target_pct")} onChange={(v) => set(i, "profit_target_pct", v)} type="number" step={0.1} />
              <Field k="DD día %" v={cur(i, "max_daily_drawdown_pct")} onChange={(v) => set(i, "max_daily_drawdown_pct", v)} type="number" step={0.1} />
              <Field k="DD máx %" v={cur(i, "max_total_drawdown_pct")} onChange={(v) => set(i, "max_total_drawdown_pct", v)} type="number" step={0.1} />
              <Field k="Días mín." v={cur(i, "min_trading_days")} onChange={(v) => set(i, "min_trading_days", v)} type="number" step={1} />
              <Field k="Días máx." v={cur(i, "time_limit_days")} onChange={(v) => set(i, "time_limit_days", v)} type="number" step={1} />
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">Reglas especiales (separadas por coma)</div>
                <input
                  value={Array.isArray(cur(i, "special_rules")) ? (cur(i, "special_rules") as string[]).join(", ") : ""}
                  onChange={(e) => set(i, "special_rules", e.target.value)}
                  placeholder="ej: scalping_unlimited, 24_7_trading, weekends_allowed"
                  className="input-gold !py-1.5 !text-xs w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-white/[0.03] cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={!!cur(i, "reset_balance_on_new_phase")}
                    onChange={(e) => set(i, "reset_balance_on_new_phase", e.target.checked)}
                    className="accent-gold-500"
                  />
                  Reset balance al cambiar de fase
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ k, v, onChange, type = "text", step }: { k: string; v: any; onChange: (v: any) => void; type?: string; step?: string | number; }) {
  return (
    <div>
      <div className="text-muted-foreground mb-1">{k}</div>
      <input
        type={type}
        step={step}
        value={v ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        className="input-gold !py-1.5 !text-xs"
      />
    </div>
  );
}
