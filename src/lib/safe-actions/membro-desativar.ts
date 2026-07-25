"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  membroId: z.string().uuid(),
});

// SA-24 (membro.desativar) — master doc §4: "Nunca deleta. ativo=false preserva histórico
// de votos". Auto-desativação é bloqueada: sem uma Safe Action de reativação no catálogo,
// um admin que se desativasse tiraria a org de qualquer admin permanentemente.
export const desativarMembro = actionClient
  .metadata({ acao: "membro.desativar", entidade: "membros" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: alvo, error } = await supabase
      .from("membros")
      .select("id, org_id, nome, ativo")
      .eq("id", parsedInput.membroId)
      .single();

    if (error || !alvo) {
      throw new Error("Membro não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", alvo.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro || membro.papel !== "admin") {
      throw new Error("Só admin pode desativar membros.");
    }
    if (membro.id === alvo.id) {
      throw new Error("Você não pode desativar a si mesmo.");
    }

    if (!alvo.ativo) {
      return { desativado: true, jaEstava: true };
    }

    const { error: updateError } = await supabase
      .from("membros")
      .update({ ativo: false })
      .eq("id", alvo.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: alvo.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: alvo.id,
      antes: { ativo: true },
      depois: { ativo: false },
    });

    return { desativado: true, jaEstava: false };
  });
