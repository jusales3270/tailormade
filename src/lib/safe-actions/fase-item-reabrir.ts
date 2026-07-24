"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseItemId: z.string().uuid(),
  justificativa: z.string().trim().min(1, "Justificativa é obrigatória para reabrir um item."),
});

// SA-06 (fase_item.reabrir) — master doc §4: "Exige justificativa não vazia". O guard de
// papel segue o mesmo de SA-05 (responsável da fase ou admin): reabrir é a operação
// inversa sobre a mesma linha, não faz sentido ter um dono diferente.
export const reabrirFaseItem = actionClient
  .metadata({ acao: "fase_item.reabrir", entidade: "fase_itens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: item, error: itemError } = await supabase
      .from("fase_itens")
      .select("id, concluido, concluido_por, concluido_em, fases(org_id, responsavel_id)")
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
      throw new Error("Só o responsável da fase ou um admin pode reabrir este item.");
    }

    if (!item.concluido) {
      return { concluido: false, jaEstava: true };
    }

    const { error: updateError } = await supabase
      .from("fase_itens")
      .update({ concluido: false, concluido_por: null, concluido_em: null })
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
      antes: { concluido: true, concluido_por: item.concluido_por, concluido_em: item.concluido_em },
      depois: { concluido: false, justificativa: parsedInput.justificativa },
    });

    return { concluido: false, jaEstava: false };
  });
