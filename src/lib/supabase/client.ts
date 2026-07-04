import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para usarse en Client Components (navegador).
 * Usa la anon key — el acceso real a los datos lo controla RLS en Supabase,
 * exigiendo un usuario autenticado (ver políticas "pedidos_select_authenticated"
 * y "pedidos_update_authenticated").
 *
 * Se guarda como singleton: crear un createBrowserClient distinto en cada
 * llamada dispara la advertencia de Supabase "Multiple GoTrueClient
 * instances detected" y desperdicia listeners de auth.
 */
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
