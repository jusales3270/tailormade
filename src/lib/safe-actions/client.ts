import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// metadata obrigatória em toda Safe Action: acao/entidade nomeiam o quê vai para
// auditoria (master doc §4/§5) — cada ação declara isso ao definir, não a runtime.
const metadataSchema = z.object({
  acao: z.string(),
  entidade: z.string(),
});

export const actionClient = createSafeActionClient({
  defineMetadataSchema: () => metadataSchema,
  handleServerError(e) {
    console.error(e);
    return e.message;
  },
}).use(async ({ next }) => {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return next({ ctx: { supabase, userId: sessao.claims.sub as string } });
});
