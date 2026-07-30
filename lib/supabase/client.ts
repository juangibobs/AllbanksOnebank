import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached =
    url && anonKey
      ? createClient(url, anonKey, {
          auth: {
            // Flujo 100% cliente (sin ruta de servidor para intercambiar el código):
            // el SDK procesa el enlace mágico directamente desde el hash de la URL.
            flowType: "implicit",
            persistSession: true,
            detectSessionInUrl: true,
          },
        })
      : null;
  return cached;
}
