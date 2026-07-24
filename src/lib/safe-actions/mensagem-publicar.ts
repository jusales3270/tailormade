"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  canalId: z.string().uuid(),
  corpo: z.string().trim().min(1, "Mensagem vazia."),
});

// SA-01 (mensagem.publicar) — master doc §4: "Membro ativo, canal não arquivado".
export const publicarMensagem = actionClient
  .metadata({ acao: "mensagem.publicar", entidade: "mensagens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: canal, error: canalError } = await supabase
      .from("canais")
      .select("id, org_id, arquivado")
      .eq("id", parsedInput.canalId)
      .single();

    if (canalError || !canal) {
      throw new Error("Canal não encontrado ou sem acesso.");
    }
    if (canal.arquivado) {
      throw new Error("Este canal está arquivado — não recebe mensagens novas.");
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

    const { data: mensagem, error: insertError } = await supabase
      .from("mensagens")
      .insert({ canal_id: canal.id, autor_id: membro.id, corpo: parsedInput.corpo })
      .select("id, criado_em")
      .single();

    if (insertError || !mensagem) {
      throw new Error(insertError?.message ?? "Falha ao publicar a mensagem.");
    }

    await registrarAuditoria({
      orgId: canal.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: mensagem.id,
      antes: null,
      depois: { canalId: canal.id, corpo: parsedInput.corpo },
    });

    return { id: mensagem.id, criadoEm: mensagem.criado_em };
  });
