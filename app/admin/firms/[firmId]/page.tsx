import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft } from "lucide-react";
import FirmDetailAdminClient from "@/components/admin/FirmDetailAdminClient";
import { getFirmById, getPresetsByFirm } from "@/lib/data/seed";
import type { Firm, FirmPreset } from "@/lib/types";

export default async function AdminFirmDetailPage({ params }: { params: Promise<{ firmId: string }> }) {
  const { firmId } = await params;
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data?.user) redirect("/login?next=/admin/firms/" + firmId);

  // 1) Intentar leer de SUPABASE REAL primero (origen verdadero)
  let firm: Firm | undefined;
  let presets: FirmPreset[] = [];
  try {
    const [fRes, pRes] = await Promise.all([
      sb.from("firms").select("*").eq("id", firmId).maybeSingle(),
      sb.from("firm_presets").select("*").eq("firm_id", firmId).order("order_index", { ascending: true }),
    ]);
    firm = (fRes?.data as Firm | undefined) ?? undefined;
    presets = (pRes?.data as FirmPreset[]) ?? [];
  } catch {
    firm = undefined;
    presets = [];
  }

  // 2) Fallback al seed local SI la DB no devolvió nada (demo mode / sin datos reales)
  const finalFirm: Firm = (firm ?? getFirmById(firmId)) as Firm;
  const finalPresets: FirmPreset[] = presets.length > 0 ? presets : (finalFirm ? getPresetsByFirm(finalFirm.id) : []);

  if (!finalFirm) {
    return (
      <div className="p-10 max-w-3xl mx-auto text-center">
        <p className="text-muted-foreground mb-6">Firma no encontrada.</p>
        <Link href="/admin" className="btn-ghost-gold"><ChevronLeft className="w-4 h-4" /> Volver</Link>
      </div>
    );
  }

  return <FirmDetailAdminClient firm={finalFirm} initialPresets={finalPresets} />;
}
