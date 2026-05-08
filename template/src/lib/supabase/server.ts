// Server-side Supabase client for Server Components / Route Handlers.
// Still uses the anon key — RLS does the gatekeeping. Switch to a
// service-role client (separate file) only for trusted server-only operations.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
