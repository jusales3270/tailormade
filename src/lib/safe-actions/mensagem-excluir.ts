"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  mensagemId: z.string().uuid(),
});

// mensagem.excluir — só o autor, sem janela de tempo (diferente de mensagem.editar):
// apagar não reescreve o que já foi lido, só some com a mensagem — e se ela já foi
// guardada no livro de registros, o snapshot em `registros` continua intacto.
export const excluirMensagem = actionClient
  .metadata({ acao: "mensagem.excluir", entidade: "mensagens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: mensagem, error } = await supabase
      .from("mensagens")
      .select("id, corpo, autor_id, canais(org_id)")
      .eq("id", parsedInput.mensagemId)
      .single();

    if (error || !mensagem || !mensagem.canais) {
      throw new Error("Mensagem não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", mensagem.canais.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.id !== mensagem.autor_id) {
      throw new Error("Só o autor pode excluir esta mensagem.");
    }

    const { error: deleteError } = await supabase.from("mensagens").delete().eq("id", mensagem.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: mensagem.canais.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: mensagem.id,
      antes: { corpo: mensagem.corpo },
      depois: null,
    });

    return { id: mensagem.id };
  });
