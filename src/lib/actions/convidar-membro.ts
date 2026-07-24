"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// SA-23 (membro.convidar) — master doc §4. Só admin, define papel no convite.
//
// O INSERT roda com a sessão do próprio chamador (createClient, não o admin client), então
// a policy membros_insert_admin da RLS já recusa isso sozinha se ele não for admin da org
// — o guard não depende desta função "lembrar" de checar o papel.
const schema = z.object({
  orgId: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  papel: z.enum(["admin", "socio", "tecnico", "convidado"]),
});

export type ConvidarMembroInput = z.infer<typeof schema>;
export type ConvidarMembroResultado = { ok: true } | { ok: false; erro: string };

export async function convidarMembro(
  input: ConvidarMembroInput,
): Promise<ConvidarMembroResultado> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { orgId, nome, email, papel } = parsed.data;

  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  const { error: insertError } = await supabase.from("membros").insert({
    org_id: orgId,
    nome,
    email,
    papel,
    participacao_pct: 0,
  });

  if (insertError) {
    const negadoPelaRls = insertError.code === "42501";
    return {
      ok: false,
      erro: negadoPelaRls
        ? "Só admin pode convidar membros."
        : `Não deu para registrar o convite: ${insertError.message}`,
    };
  }

  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/definir-senha`,
    data: { nome },
  });

  if (inviteError) {
    return { ok: false, erro: `Convite não enviado: ${inviteError.message}` };
  }

  return { ok: true };
}
