// Browser-side Supabase client. Uses the anon key — safe to ship to the browser
// because RLS policies enforce access. Never import the service-role key here.
//
// Lazy-initialized so that importing this module never throws at load time:
// the placeholder demo page does not call this; cloned projects opt in.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.",
    );
  }
  client = createClient(url, anonKey);
  return client;
}
