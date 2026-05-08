// Browser-side Supabase client. Uses the anon key — safe to ship to the browser
// because RLS policies enforce access. Never import the service-role key here.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);
