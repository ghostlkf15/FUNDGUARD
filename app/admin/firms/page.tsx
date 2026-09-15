import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Crown, ChevronRight, PlusCircle, Wallet, Search } from "lucide-react";
import { DEFAULT_FIRMS, getPresetsByFirm, getFirmsByMarket } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import { FirmLogo } from "@/components/ui/firm-logo";

export default async function AdminFirmsListPage() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data?.user) redirect("/login?next=/admin/firms");

  const byMarket: Record<string, typeof DEFAULT_FIRMS> = {
    forex: getFirmsByMarket("forex"),
    futures: getFirmsByMarket("futures"),
    crypto: getFirmsByMarket("crypto"),
  };

  return (
    <div className="p-6 md:p-10 max-w-[1500px] mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 mb-4">
            <Crown className="w-3.5 h-3.5 text-gold-300"/>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-200">Admin · catálogo</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
            Firmas & <span className="gold-gradient-text">Presets</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">Explora, edita y añade nuevas firmas y reglas. Cambios en vivo.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar firma, mercado, balance…"
              className="input-gold !py-2 pl-10 pr-4 w-full md:w-80"
            />
          </div>
          <Link href="/admin/firms/new" className="btn-gold !py-2 text-sm">
            <PlusCircle className="w-4 h-4" /> Nueva firma
          </Link>
        </div>
      </header>

      {(Object.keys(byMarket)).map((m) => byMarket[m].length ? (
        <section key={m}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Mercado</div>
              <h2 className="font-display text-2xl capitalize">
                {m === "forex" ? "Forex" : m === "futures" ? "Futuros" : "Cripto"}
              </h2>
            </div>
            <div className="text-sm text-muted-foreground">{byMarket[m].length} firmas</div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {byMarket[m].map((f) => {
              const presets = getPresetsByFirm(f.id);
              return (
                <Link
                  key={f.id}
                  href={`/admin/firms/${f.id}`}
                  className="glass-card p-6 relative group transition-all hover:border-gold-500/30 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FirmLogo firm={f} size="md" className="shadow-gold/40" useMarketIcon />
                      <div>
                        <h3 className="font-semibold text-lg leading-tight mb-1">{f.name}</h3>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          m === "forex" && "bg-sky-500/10 text-sky-300 border-sky-400/20",
                          m === "futures" && "bg-violet-500/10 text-violet-300 border-violet-400/20",
                          m === "crypto" && "bg-amber-500/10 text-amber-300 border-amber-400/20",
                        )}>{m === "forex" ? "Forex" : m === "futures" ? "Futuros" : "Cripto"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold-300 transition-colors" />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                    {f.description || `Presets y reglas oficiales de ${f.name}.`}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5"/> Presets</span>
                      <span className="font-semibold text-foreground">{presets.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((p) => (
                        <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/[0.05]">
                    <div className="text-[11px] text-muted-foreground">Fases por preset: <span className="text-foreground/80">{presets[0]?.phases.length || 2}</span></div>
                    <button className="text-[11px] px-3 py-1 rounded-lg bg-gold-500/10 text-gold-300 border border-gold-500/20 font-medium hover:bg-gold-500/20 transition-colors">Gestionar</button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null)}
    </div>
  );
}
