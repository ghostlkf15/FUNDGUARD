import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminHomeClient from "@/components/admin/AdminHomeClient";
import type { Firm, FirmPreset } from "@/lib/types";

export default async function AdminHome() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  let user: any = null;
  let isAdmin = false;
  if (data?.user) {
    let profile: any = null;
    try {
      const res = await sb
        .from("profiles")
        .select("is_admin, full_name, email:id")
        .eq("id", data.user.id)
        .maybeSingle();
      profile = res?.data ?? null;
    } catch { profile = null; }
    const merged = profile || { is_admin: false, full_name: data.user.email, email: data.user.email };
    user = { ...data.user, ...merged, email: data.user.email || merged.email };
    isAdmin = !!profile?.is_admin;
  }
  if (!user) redirect("/login?next=/admin");

  let firms: Firm[] = [];
  let presets: FirmPreset[] = [];
  try {
    const [f, p] = await Promise.all([
      sb.from("firms").select("*").order("order_index", { ascending: true }),
      sb.from("firm_presets").select("*").order("firm_id").order("order_index"),
    ]);
    firms = (f?.data as Firm[]) || [];
    presets = (p?.data as FirmPreset[]) || [];
  } catch { /* seed local */ }

  return <AdminHomeClient user={user} isAdmin={isAdmin} realFirms={firms} realPresets={presets} />;
}
