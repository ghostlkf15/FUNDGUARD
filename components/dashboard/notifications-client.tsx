"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Check,
  Mail,
} from "@/lib/ui/lucide-polyfill";
import { toast } from "@/components/ui/sonner";
import { markEventReadAction, markAllEventsReadAction } from "@/lib/dashboard/actions";
import { cn, formatRelative } from "@/lib/utils";
import type { RuleEvent, Challenge, Firm, RuleEventType } from "@/lib/types";

export type FilterKey = "all" | "approved" | "failed" | "alert" | "system";

interface EnrichedEvent extends RuleEvent {
  challenge?: (Challenge & { firm: Firm }) | null;
}

interface NotificationsClientProps {
  initialEvents: EnrichedEvent[];
  initialCounts: Record<FilterKey, number>;
  initialUnread: number;
  hasRealData: boolean;
}

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "approved", label: "Aprobaciones" },
  { key: "failed", label: "Reprobaciones" },
  { key: "alert", label: "Alertas" },
  { key: "system", label: "Sistema" },
];

const KIND_FROM_TYPE: Partial<Record<RuleEventType, FilterKey>> = {
  approved: "approved",
  phase_change: "approved",
  min_days_met: "approved",
  failed_max_dd: "failed",
  failed_daily_dd: "failed",
  failed_special: "failed",
  disconnected: "system",
  reconnected: "system",
  alert_daily_dd: "alert",
  alert_max_dd: "alert",
  warning_best_day_ratio: "alert",
  warning_scalping: "alert",
};

function titleForType(t: RuleEventType, ch: (Challenge & { firm: Firm }) | null | undefined): string {
  const firm = ch?.firm?.name ? `${ch.firm.name} ` : "";
  switch (t) {
    case "approved":
      return `¡${firm}Desafío APROBADO!`;
    case "phase_change":
      return `${firm}Fase completada · pasa de fase`;
    case "min_days_met":
      return `${firm}Requisito de días mínimo alcanzado`;
    case "failed_max_dd":
      return `${firm}Reprobado por Drawdown máximo`;
    case "failed_daily_dd":
      return `${firm}Reprobado por Drawdown diario`;
    case "failed_special":
      return `${firm}Reprobado por regla especial`;
    case "disconnected":
      return `${firm}Conexión perdida`;
    case "reconnected":
      return `${firm}Conexión reestablecida`;
    case "alert_daily_dd":
      return `⚠ ${firm}DD diario cerca del límite`;
    case "alert_max_dd":
      return `⚠ ${firm}DD total cerca del límite`;
    case "warning_best_day_ratio":
      return `⚡ ${firm}Aviso de ratio PnL 1 día`;
    case "warning_scalping":
      return `⚡ ${firm}Patrón de scalping detectado`;
    default:
      return `Evento del motor`;
  }
}

function iconForKind(k: FilterKey, sev: string) {
  if (k === "approved") return { Ico: CheckCircle2, color: "emerald" as const };
  if (k === "failed") return { Ico: XCircle, color: "rose" as const };
  if (k === "alert") return { Ico: sev === "critical" ? BellRing : AlertTriangle, color: "amber" as const };
  return { Ico: BellRing, color: "sky" as const };
}

export function NotificationsClient({
  initialEvents,
  initialCounts,
  initialUnread,
  hasRealData,
}: NotificationsClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [events, setEvents] = useState<EnrichedEvent[]>(initialEvents);
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => KIND_FROM_TYPE[e.type] === filter);
  }, [events, filter]);

  const unreadCount = events.filter((e) => !e.is_read).length;

  function markRead(id: string) {
    startTransition(async () => {
      if (!hasRealData) {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, is_read: true, read_at: new Date().toISOString() } : e)),
        );
        toast.success("Marcado como leído (demo)");
        return;
      }
      try {
        await markEventReadAction(id, true);
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, is_read: true, read_at: new Date().toISOString() } : e)),
        );
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "sin detalles";
        toast.error("No se pudo marcar como leído", { description: m });
      }
    });
  }

  function markAll() {
    startTransition(async () => {
      if (!hasRealData) {
        setEvents((prev) => prev.map((e) => ({ ...e, is_read: true, read_at: new Date().toISOString() })));
        toast.success("Todas marcadas como leídas (demo)");
        return;
      }
      try {
        await markAllEventsReadAction();
        setEvents((prev) => prev.map((e) => ({ ...e, is_read: true, read_at: new Date().toISOString() })));
        toast.success("Todas las notificaciones leídas");
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "sin detalles";
        toast.error("No se pudieron marcar como leídas", { description: m });
      }
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map((t) => {
            const count = initialCounts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all inline-flex items-center gap-2",
                  filter === t.key
                    ? "bg-gold-500/15 text-gold-200 border-gold-500/30 shadow-gold"
                    : "bg-white/[0.03] border-white/[0.05] text-muted-foreground hover:border-gold-500/20 hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider",
                    filter === t.key
                      ? "bg-gold-500/25 text-gold-100"
                      : "bg-white/[0.04] text-muted-foreground/80",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              disabled={pending}
              className="btn-ghost-gold px-4 py-2 text-sm inline-flex items-center gap-2 !rounded-xl"
            >
              <Check className="w-4 h-4" />
              Marcar todas leídas
            </button>
          )}
          <div className="chip-gold !py-0 !gap-1.5">
            <BellRing className="w-3 h-3" />
            <span className="font-semibold">{unreadCount}</span>
            <span className="text-muted-foreground/80">sin leer</span>
          </div>
        </div>
      </div>

      <div className="glass-card !p-0 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold-500/5 to-transparent pointer-events-none" />
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold">Sin notificaciones en esta vista</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Aún no hay eventos del motor que coincidan con el filtro. Cuando tu desafío
              empiece a operar verás aquí aprobaciones, reprobaciones y alertas en tiempo real.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((n, idx) => {
              const kind = KIND_FROM_TYPE[n.type] ?? "system";
              const { Ico, color } = iconForKind(kind, n.severity);
              return (
                <li
                  key={n.id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className={cn(
                    "px-6 py-5 flex items-start gap-4 transition-all group hover:bg-white/[0.025] animate-fade-in-up relative",
                    !n.is_read && "bg-gold-500/[0.04]",
                  )}
                >
                  {!n.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r bg-gold-400 shadow-gold" />
                  )}
                  <div
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center relative",
                      color === "emerald" &&
                        "bg-emerald-500/10 border-emerald-400/20 group-hover:bg-emerald-500/15",
                      color === "rose" &&
                        "bg-rose-500/10 border-rose-400/20 group-hover:bg-rose-500/15",
                      color === "amber" &&
                        "bg-amber-500/10 border-amber-400/20 group-hover:bg-amber-500/15",
                      color === "sky" &&
                        "bg-sky-500/10 border-sky-400/20 group-hover:bg-sky-500/15",
                    )}
                  >
                    <Ico
                      className={cn(
                        "w-5 h-5",
                        color === "emerald" && "text-emerald-300",
                        color === "rose" && "text-rose-300",
                        color === "amber" && "text-amber-300",
                        color === "sky" && "text-sky-300",
                      )}
                    />
                    {!n.is_read && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold-400 shadow-gold animate-pulse ring-2 ring-black" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold leading-tight">
                        {titleForType(n.type, n.challenge)}
                      </h3>
                      {!n.is_read && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-gold-500/15 border border-gold-500/30 text-gold-200">
                          Nuevo
                        </span>
                      )}
                      {n.challenge?.firm?.name && (
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2 py-0.5 rounded-full border border-white/[0.06]">
                          {n.challenge.firm.name}
                        </span>
                      )}
                      {n.challenge?.initial_balance && (
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2 py-0.5 rounded-full border border-white/[0.06]">
                          ${n.challenge.initial_balance.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <div className="text-[11px] text-muted-foreground/70 inline-flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 opacity-60" />
                        {formatRelative(n.created_at)}
                      </div>
                      {n.read_at && (
                        <div className="text-[11px] text-muted-foreground/60 inline-flex items-center gap-1.5">
                          <Check className="w-3 h-3 opacity-60" />
                          Leído {formatRelative(n.read_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {n.challenge ? (
                      <button
                        onClick={() =>
                          router.push(`/dashboard/${n.challenge!.id}`)
                        }
                        className="p-2 rounded-xl text-muted-foreground hover:text-gold-300 hover:bg-white/[0.04] transition-colors"
                        title="Ver desafío"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-2 py-1 rounded-full border border-white/[0.05]">
                        Demo
                      </span>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/[0.06] text-muted-foreground/80 hover:text-gold-300 hover:border-gold-500/30 transition-colors"
                      >
                        Leer
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
