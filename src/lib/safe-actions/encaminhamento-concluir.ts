"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  encaminhamentoId: z.string().uuid(),
});

// SA-19 (encaminhamento.concluir) — master doc §4: "Responsável ou admin". A policy
// encaminhamentos_update já trava isso no banco; o guard aqui é defesa em profundidade.
export const concluirEncaminhamento = actionClient
  .metadata({ acao: "encaminhamento.concluir", entidade: "encaminhamentos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: encaminhamento, error } = await supabase
      .from("encaminhamentos")
      .select("id, org_id, responsavel_id, status")
      .eq("id", parsedInput.encaminhamentoId)
      .single();

    if (error || !encaminhamento) {
      throw new Error("Encaminhamento não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", encaminhamento.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.id !== encaminhamento.responsavel_id) {
      throw new Error("Só o responsável ou um admin pode concluir este encaminhamento.");
    }

    if (encaminhamento.status === "concluido") {
      return { concluido: true, jaEstava: true };
    }

    const { error: updateError } = await supabase
      .from("encaminhamentos")
      .update({ status: "concluido" })
      .eq("id", encaminhamento.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: encaminhamento.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: encaminhamento.id,
      antes: { status: encaminhamento.status },
      depois: { status: "concluido" },
    });

    return { concluido: true, jaEstava: false };
  });
