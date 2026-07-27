"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  documentoId: z.string().uuid(),
});

// documento.excluir — só o autor, e só enquanto nenhuma versão foi enviada. Uma vez
// que existe documento_versoes (arquivo/hash/assinatura), excluir o documento
// cascatearia e destruiria essa proveniência — igual ao "nunca sobrescreve" de
// documento_versoes, só que aplicado a apagar em vez de substituir.
export const excluirDocumento = actionClient
  .metadata({ acao: "documento.excluir", entidade: "documentos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: documento, error } = await supabase
      .from("documentos")
      .select("id, org_id, codigo, nome, criado_por")
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
      throw new Error("Só quem criou este documento pode excluí-lo.");
    }

    const { count } = await supabase
      .from("documento_versoes")
      .select("id", { count: "exact", head: true })
      .eq("documento_id", documento.id);

    if ((count ?? 0) > 0) {
      throw new Error("Não dá pra excluir: já tem versão de arquivo enviada para este documento.");
    }

    const { error: deleteError } = await supabase.from("documentos").delete().eq("id", documento.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: documento.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: documento.id,
      antes: { codigo: documento.codigo, nome: documento.nome },
      depois: null,
    });

    return { id: documento.id };
  });
