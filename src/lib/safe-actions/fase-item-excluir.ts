"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseItemId: z.string().uuid(),
});

// fase_item.excluir — só item não concluído. Mesmo raciocínio de fase.excluir: apagar um
// item já concluído apaga o registro de quem o concluiu e quando, e os anéis do cockpit
// passam a contar uma história diferente da que aconteceu. Item errado que já foi marcado
// se reabre (SA-06) antes de sumir.
export const excluirFaseItem = actionClient
  .metadata({ acao: "fase_item.excluir", entidade: "fase_itens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: item, error } = await supabase
      .from("fase_itens")
      .select("id, titulo, ordem, concluido, fases(org_id)")
      .eq("id", parsedInput.faseItemId)
      .single();

    if (error || !item || !item.fases) {
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
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio removem itens da trilha.");
    }
    if (item.concluido) {
      throw new Error("Item concluído não pode ser excluído. Reabra antes.");
    }

    const { error: deleteError } = await supabase.from("fase_itens").delete().eq("id", item.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: item.fases.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: item.id,
      antes: { titulo: item.titulo, ordem: item.ordem },
      depois: null,
    });

    return { excluido: true };
  });
