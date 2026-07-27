"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  documentoId: z.string().uuid(),
  nome: z.string().trim().min(1),
  grupo: z.string().trim().min(1),
  critico: z.boolean(),
});

// documento.editar — só quem criou o registro (criado_por) edita, mesmo sendo admin/
// socio de outro (RLS documentos_write permite qualquer admin/socio; essa checagem
// aqui é a regra de negócio "só o autor" por cima da regra de acesso da RLS).
export const editarDocumento = actionClient
  .metadata({ acao: "documento.editar", entidade: "documentos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: documento, error } = await supabase
      .from("documentos")
      .select("id, org_id, criado_por, nome, grupo, critico")
      .eq("id", parsedInput.documentoId)
      .single();

    if (error || !documento) {
      throw new Error("Documento não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", documento.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (!documento.criado_por || documento.criado_por !== membro.id) {
      throw new Error("Só quem criou este documento pode editá-lo.");
    }

    const { error: updateError } = await supabase
      .from("documentos")
      .update({ nome: parsedInput.nome, grupo: parsedInput.grupo, critico: parsedInput.critico })
      .eq("id", documento.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: documento.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: documento.id,
      antes: { nome: documento.nome, grupo: documento.grupo, critico: documento.critico },
      depois: { nome: parsedInput.nome, grupo: parsedInput.grupo, critico: parsedInput.critico },
    });

    return { id: documento.id };
  });
