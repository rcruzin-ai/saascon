// Server-side Supabase client for Server Components / Route Handlers.
// Still uses the anon key — RLS does the gatekeeping. Switch to a
// service-role client (separate file) only for trusted server-only operations.
import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
