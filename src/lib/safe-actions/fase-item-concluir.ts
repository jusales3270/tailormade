"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseItemId: z.string().uuid(),
});

// SA-05 (fase_item.concluir) — master doc §4: "Responsável da fase ou admin".
// Primeira Safe Action do projeto: estabelece o padrão (schema, guard, mutação com a
// sessão do usuário, auditoria pelo admin client) que as próximas 27 vão repetir.
export const concluirFaseItem = actionClient
  .metadata({ acao: "fase_item.concluir", entidade: "fase_itens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: item, error: itemError } = await supabase
      .from("fase_itens")
      .select("id, concluido, fases(org_id, responsavel_id)")
      .eq("id", parsedInput.faseItemId)
      .single();

    if (itemError || !item || !item.fases) {
      throw new Error("Item não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", item.fases.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }

    if (membro.papel !== "admin" && membro.id !== item.fases.responsavel_id) {
      throw new Error("Só o responsável da fase ou um admin pode concluir este item.");
    }

    if (item.concluido) {
      return { concluido: true, jaEstava: true };
    }

    const agora = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("fase_itens")
      .update({ concluido: true, concluido_por: membro.id, concluido_em: agora })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: item.fases.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: item.id,
      antes: { concluido: false },
      depois: { concluido: true, concluido_por: membro.id, concluido_em: agora },
    });

    return { concluido: true, jaEstava: false };
  });
