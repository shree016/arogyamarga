// Replaced Prisma with Supabase client. Export supabase clients for server and browser use.
import supabaseDefault, { supabase, supabaseAdmin } from "./supabase";

export { supabase, supabaseAdmin };

// Default export kept for convenience
export default supabaseDefault;
