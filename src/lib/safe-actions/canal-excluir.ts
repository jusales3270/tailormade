"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  canalId: z.string().uuid(),
});

// canal.excluir — só quem criou, e só se ninguém mandou mensagem nele ainda. mensagens
// tem ON DELETE CASCADE a partir de canais: excluir o canal apagaria mensagens de
// outras pessoas junto, o que a regra "só afeta o que você criou" não permite.
export const excluirCanal = actionClient
  .metadata({ acao: "canal.excluir", entidade: "canais" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: canal, error } = await supabase
      .from("canais")
      .select("id, org_id, criado_por, slug, nome")
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
      throw new Error("Só quem criou este canal pode excluí-lo.");
    }

    const { count: mensagensCount } = await supabase
      .from("mensagens")
      .select("id", { count: "exact", head: true })
      .eq("canal_id", canal.id);

    if ((mensagensCount ?? 0) > 0) {
      throw new Error("Não dá pra excluir: já tem mensagem postada neste canal.");
    }

    const { error: deleteError } = await supabase.from("canais").delete().eq("id", canal.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: canal.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: canal.id,
      antes: { slug: canal.slug, nome: canal.nome },
      depois: null,
    });

    return { id: canal.id };
  });
