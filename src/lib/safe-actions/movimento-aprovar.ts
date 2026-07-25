"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  movimentoId: z.string().uuid(),
});

// SA-21 (movimento.aprovar) — master doc §2.6/§8: "Aprovador ≠ solicitante, sempre,
// qualquer que seja o valor". Transiciona aguarda_aprovacao → aprovado (o check
// aprovador_id <> solicitante_id no schema é a segunda camada dessa mesma regra).
export const aprovarMovimento = actionClient
  .metadata({ acao: "movimento.aprovar", entidade: "movimentos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: movimento, error } = await supabase
      .from("movimentos")
      .select("id, org_id, status, solicitante_id")
      .eq("id", parsedInput.movimentoId)
      .single();

    if (error || !movimento) {
      throw new Error("Movimento não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", movimento.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro || (membro.papel !== "admin" && membro.papel !== "socio")) {
      throw new Error("Só admin ou sócio pode aprovar movimentos.");
    }
    if (movimento.status !== "aguarda_aprovacao") {
      throw new Error("Este movimento não está aguardando aprovação.");
    }
    if (membro.id === movimento.solicitante_id) {
      throw new Error("O aprovador não pode ser o mesmo membro que solicitou o movimento.");
    }

    const { error: updateError } = await supabase
      .from("movimentos")
      .update({ status: "aprovado", aprovador_id: membro.id })
      .eq("id", movimento.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: movimento.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: movimento.id,
      antes: { status: movimento.status },
      depois: { status: "aprovado", aprovadorId: membro.id },
    });

    return { aprovado: true };
  });
