import { createClient } from "@supabase/supabase-js";

type ServiceClient = ReturnType<typeof createClient>;
let _client: ServiceClient | null = null;

export function createServiceClient(): ServiceClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !/^https?:\/\//i.test(String(url))) {
    throw new Error(
      "[supabase/service] NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL) no configurada o inválida. Revisa variables de entorno.",
    );
  }
  if (!service || String(service).length < 40) {
    throw new Error(
      "[supabase/service] SUPABASE_SERVICE_ROLE_KEY no configurada. Es obligatoria para endpoints server-only (/api/report, /api/worker/*).",
    );
  }

  _client = createClient(String(url), String(service), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${service}`,
        "X-FundGuard-Node": "service",
      },
    },
  });
  return _client;
}
