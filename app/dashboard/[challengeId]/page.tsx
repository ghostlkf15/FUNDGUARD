import type { Challenge, EquitySnapshot, Trade, RuleEvent, Firm, FirmPreset } from "@/lib/types";
import { getFirmById, getPresetById } from "@/lib/data/seed";
import { getFirmByIdLive, getPresetByIdLive } from "@/lib/data/catalog-live";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChallengeDetailClient from "@/components/dashboard/challenge-detail";

export interface ChallengeDetailBundle {
  challenge: Challenge;
  equitySeries: { d: string; equity: number; peak: number; init: number }[];
  dailyPnlSeries: { d: string; pnl: number }[];
  trades: Trade[];
  events: RuleEvent[];
  firm: Firm;
  preset: FirmPreset;
}

async function loadBundle(userId: string, challengeId: string): Promise<ChallengeDetailBundle | null> {
  const sb = await createClient();
  const { data: ch, error: chErr } = await sb
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (chErr || !ch) return null;

  const [firm, preset, snaps, trades, events] = await Promise.all([
    getFirmByIdLive(ch.firm_id).then(f => f || getFirmById(ch.firm_id)),
    getPresetByIdLive(ch.preset_id).then(p => p || getPresetById(ch.preset_id)),
    sb.from("equity_snapshots").select("*").eq("challenge_id", challengeId).order("timestamp", { ascending: true }).limit(500),
    sb.from("trades").select("*").eq("challenge_id", challengeId).order("open_time", { ascending: false }).limit(200),
    sb.from("rule_events").select("*").eq("challenge_id", challengeId).order("created_at", { ascending: false }).limit(200),
  ]);

  if (!firm || !preset) return null;

  const initial = ch.initial_balance;
  let peak = initial;
  const equitySeries: { d: string; equity: number; peak: number; init: number }[] = [];
  const dailyPnlSeries: { d: string; pnl: number }[] = [];
  let prevBalance = initial;
  const lastSnapByDay = new Map<string, any>();
  for (const s of (snaps.data || []) as EquitySnapshot[]) {
    const day = new Date(s.timestamp).toISOString().slice(0, 10);
    lastSnapByDay.set(day, s);
  }
  const dayKeys = Array.from(lastSnapByDay.keys()).sort();
  dayKeys.forEach((day, i) => {
    const s = lastSnapByDay.get(day)!;
    const equity = s.equity;
    const balance = s.balance;
    peak = Math.max(peak, equity);
    const d = `D${i + 1}`;
    equitySeries.push({ d, equity: Math.round(equity), peak: Math.round(peak), init: initial });
    dailyPnlSeries.push({ d, pnl: Math.round((balance - prevBalance) * 100) / 100 });
    prevBalance = balance;
  });

  return {
    challenge: ch as Challenge,
    equitySeries,
    dailyPnlSeries,
    trades: (trades.data || []) as Trade[],
    events: (events.data || []) as RuleEvent[],
    firm,
    preset,
  };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const sb = await createClient();
  const { data: uData, error: uErr } = await sb.auth.getUser();
  if (uErr || !uData?.user) redirect(`/login?next=/dashboard/${encodeURIComponent(challengeId)}`);

  const bundle = await loadBundle(uData.user.id, challengeId);
  return <ChallengeDetailClient challengeId={challengeId} serverBundle={bundle || null} />;
}
