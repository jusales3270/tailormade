"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  canalId: z.string().uuid(),
  nome: z.string().trim().min(1).max(60),
  descricao: z.string().trim().max(200).optional(),
});

// canal.editar — só quem criou o canal.
export const editarCanal = actionClient
  .metadata({ acao: "canal.editar", entidade: "canais" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: canal, error } = await supabase
      .from("canais")
      .select("id, org_id, criado_por, nome, descricao")
      .eq("id", parsedInput.canalId)
      .single();

    if (error || !canal) {
      throw new Error("Canal não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", canal.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (!canal.criado_por || canal.criado_por !== membro.id) {
      throw new Error("Só quem criou este canal pode editá-lo.");
    }

    const { error: updateError } = await supabase
      .from("canais")
      .update({ nome: parsedInput.nome, descricao: parsedInput.descricao ?? null })
      .eq("id", canal.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: canal.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: canal.id,
      antes: { nome: canal.nome, descricao: canal.descricao },
      depois: { nome: parsedInput.nome, descricao: parsedInput.descricao ?? null },
    });

    return { id: canal.id };
  });
