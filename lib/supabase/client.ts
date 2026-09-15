import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

type Schema = Database | any;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createBrowserClient<Schema>(
    url ?? "https://placeholder.supabase.co",
    anon ?? "placeholder-anon-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
