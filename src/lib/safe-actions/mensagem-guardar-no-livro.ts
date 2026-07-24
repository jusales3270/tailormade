"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  mensagemId: z.string().uuid(),
});

// SA-03 (mensagem.guardar_no_livro) — master doc §4: "Congela snapshot do texto".
// texto_snapshot é copiado agora; editar a mensagem original depois (SA-02) não toca
// nesta linha — é exatamente o que o T-010 verifica.
export const guardarNoLivro = actionClient
  .metadata({ acao: "mensagem.guardar_no_livro", entidade: "registros" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: mensagem, error } = await supabase
      .from("mensagens")
      .select("id, corpo, canais(org_id)")
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

    const { count } = await supabase
      .from("registros")
      .select("id", { count: "exact", head: true })
      .eq("org_id", mensagem.canais.org_id);

    const codigo = `REG-${String((count ?? 0) + 1).padStart(2, "0")}`;

    const { data: registro, error: insertError } = await supabase
      .from("registros")
      .insert({
        org_id: mensagem.canais.org_id,
        codigo,
        mensagem_id: mensagem.id,
        texto_snapshot: mensagem.corpo,
        guardado_por: membro.id,
      })
      .select("id, codigo")
      .single();

    if (insertError || !registro) {
      throw new Error(insertError?.message ?? "Falha ao guardar no livro.");
    }

    await registrarAuditoria({
      orgId: mensagem.canais.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: registro.id,
      antes: null,
      depois: { codigo: registro.codigo, textoSnapshot: mensagem.corpo },
    });

    return { id: registro.id, codigo: registro.codigo };
  });
