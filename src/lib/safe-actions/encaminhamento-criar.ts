"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  titulo: z.string().trim().min(1),
  responsavelId: z.string().uuid(),
  prazo: z.string(),
  origemTipo: z.string().trim().min(1),
  origemId: z.string().uuid(),
});

// SA-18 (encaminhamento.criar) — master doc §4: "Exige responsável e prazo". Sem guard
// de papel além de não ser convidado (mesma policy de encaminhamentos_insert).
export const criarEncaminhamento = actionClient
  .metadata({ acao: "encaminhamento.criar", entidade: "encaminhamentos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", parsedInput.orgId)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }

    const { data: encaminhamento, error } = await supabase
      .from("encaminhamentos")
      .insert({
        org_id: parsedInput.orgId,
        titulo: parsedInput.titulo,
        responsavel_id: parsedInput.responsavelId,
        prazo: parsedInput.prazo,
        origem_tipo: parsedInput.origemTipo,
        origem_id: parsedInput.origemId,
      })
      .select("id")
      .single();

    if (error || !encaminhamento) {
      throw new Error(error?.message ?? "Falha ao criar o encaminhamento.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: encaminhamento.id,
      antes: null,
      depois: { titulo: parsedInput.titulo, responsavelId: parsedInput.responsavelId, prazo: parsedInput.prazo },
    });

    return { id: encaminhamento.id };
  });
