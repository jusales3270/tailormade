"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  orgId: z.string().uuid(),
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  papel: z.enum(["admin", "socio", "tecnico", "convidado"]),
});

// SA-23 (membro.convidar) — master doc §4: "Só admin, define papel no convite". O convite
// de auth precisa da service_role key (admin.auth.admin.inviteUserByEmail); já o INSERT em
// membros roda com a sessão do próprio chamador — a policy membros_insert_admin da RLS
// recusa sozinha se ele não for admin, então o guard aqui é defesa em profundidade.
export const convidarMembro = actionClient
  .metadata({ acao: "membro.convidar", entidade: "membros" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", parsedInput.orgId)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro || membro.papel !== "admin") {
      throw new Error("Só admin pode convidar membros.");
    }

    const admin = createAdminClient();
    const { data: convite, error: conviteError } = await admin.auth.admin.inviteUserByEmail(
      parsedInput.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { nome: parsedInput.nome },
      },
    );

    if (conviteError || !convite.user) {
      throw new Error(conviteError?.message ?? "Falha ao enviar o convite.");
    }

    const { data: novoMembro, error: insertError } = await supabase
      .from("membros")
      .insert({
        org_id: parsedInput.orgId,
        user_id: convite.user.id,
        nome: parsedInput.nome,
        email: parsedInput.email,
        papel: parsedInput.papel,
        participacao_pct: 0,
        ativo: true,
      })
      .select("id")
      .single();

    if (insertError || !novoMembro) {
      // Compensa o convite de auth já emitido — sem o membro correspondente, o usuário
      // convidado ficaria com login mas nenhuma organização o reconhece.
      await admin.auth.admin.deleteUser(convite.user.id);
      throw new Error(
        insertError?.code === "23505"
          ? "Já existe um membro com este e-mail nesta organização."
          : (insertError?.message ?? "Falha ao registrar o membro."),
      );
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: novoMembro.id,
      antes: null,
      depois: { nome: parsedInput.nome, email: parsedInput.email, papel: parsedInput.papel },
    });

    return { id: novoMembro.id };
  });
