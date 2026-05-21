import { createClient } from "@supabase/supabase-js";

// Support both common env names for the public key
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Browser-safe client (uses anon/public key)
export const supabase = createClient(supabaseUrl, publicKey);

// Server/admin client (uses service role key). Use only on the server.
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } },
);

export default supabase;
