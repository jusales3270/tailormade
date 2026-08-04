"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseId: z.string().uuid(),
});

// fase.excluir — fail-closed em item concluído. fase_itens tem `on delete cascade`, então
// apagar a fase apagaria junto o registro de que alguém concluiu aquele item, e com ele o
// histórico que os anéis do cockpit contam. Fase com trabalho feito não some; esvazie ou
// reabra os itens antes.
export const excluirFase = actionClient
  .metadata({ acao: "fase.excluir", entidade: "fases" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: fase, error } = await supabase
      .from("fases")
      .select("id, org_id, ordem, nome, trilho, itens:fase_itens(id, concluido)")
      .eq("id", parsedInput.faseId)
      .single();

    if (error || !fase) {
      throw new Error("Fase não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", fase.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio excluem fases.");
    }

    const concluidos = (fase.itens ?? []).filter((i) => i.concluido).length;
    if (concluidos > 0) {
      throw new Error(
        `Esta fase tem ${concluidos} ${concluidos === 1 ? "item concluído" : "itens concluídos"}. Reabra os itens antes de excluir a fase.`,
      );
    }

    const { error: deleteError } = await supabase.from("fases").delete().eq("id", fase.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: fase.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: fase.id,
      antes: { ordem: fase.ordem, nome: fase.nome, trilho: fase.trilho, itens: (fase.itens ?? []).length },
      depois: null,
    });

    return { excluida: true };
  });
