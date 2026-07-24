import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Chave service_role: bypassa RLS por completo. Só para o runtime de Safe Actions
// (ex.: SA-23 convidar membro, que precisa criar o convite de auth antes de o membro
// ter sessão própria) — nunca para servir dados de leitura comuns.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
