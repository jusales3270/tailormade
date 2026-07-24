"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  mensagemId: z.string().uuid(),
  novoCorpo: z.string().trim().min(1, "Mensagem vazia."),
});

const JANELA_EDICAO_MS = 15 * 60 * 1000;

// SA-02 (mensagem.editar) — master doc §4: "Autor, janela de 15 min, grava versão
// anterior". A versão antiga vai para mensagem_versoes antes do UPDATE — é o que
// permite ao T-010 provar que o registro guardado não muda quando a mensagem original é
// editada depois.
export const editarMensagem = actionClient
  .metadata({ acao: "mensagem.editar", entidade: "mensagens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: mensagem, error } = await supabase
      .from("mensagens")
      .select("id, corpo, autor_id, criado_em, canais(org_id)")
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
      throw new Error("Só o autor pode editar esta mensagem.");
    }

    const idadeMs = Date.now() - new Date(mensagem.criado_em).getTime();
    if (idadeMs > JANELA_EDICAO_MS) {
      throw new Error("A janela de 15 minutos para editar esta mensagem já passou.");
    }

    const { error: versaoError } = await supabase
      .from("mensagem_versoes")
      .insert({ mensagem_id: mensagem.id, corpo_anterior: mensagem.corpo });

    if (versaoError) {
      throw new Error(versaoError.message);
    }

    const agora = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("mensagens")
      .update({ corpo: parsedInput.novoCorpo, editado_em: agora })
      .eq("id", mensagem.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: mensagem.canais.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: mensagem.id,
      antes: { corpo: mensagem.corpo },
      depois: { corpo: parsedInput.novoCorpo },
    });

    return { id: mensagem.id, corpo: parsedInput.novoCorpo };
  });
