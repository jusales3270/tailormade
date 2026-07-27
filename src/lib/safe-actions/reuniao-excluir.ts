"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  reuniaoId: z.string().uuid(),
});

// reuniao.excluir — só quem marcou, só sem ata, e só se ninguém além do autor propôs
// item de pauta. reuniao_pauta tem ON DELETE CASCADE a partir de reunioes: excluir a
// reunião apagaria pauta de outras pessoas junto, o que a regra "só afeta o que você
// criou" não permite.
export const excluirReuniao = actionClient
  .metadata({ acao: "reuniao.excluir", entidade: "reunioes" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: reuniao, error } = await supabase
      .from("reunioes")
      .select("id, org_id, criado_por, codigo, titulo")
      .eq("id", parsedInput.reuniaoId)
      .single();

    if (error || !reuniao) {
      throw new Error("Reunião não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", reuniao.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (!reuniao.criado_por || reuniao.criado_por !== membro.id) {
      throw new Error("Só quem marcou esta reunião pode excluí-la.");
    }

    const { count: ataCount } = await supabase
      .from("atas")
      .select("reuniao_id", { count: "exact", head: true })
      .eq("reuniao_id", reuniao.id);

    if ((ataCount ?? 0) > 0) {
      throw new Error("Não dá pra excluir: esta reunião já tem ata publicada.");
    }

    const { data: pauta } = await supabase
      .from("reuniao_pauta")
      .select("proposto_por")
      .eq("reuniao_id", reuniao.id);

    const temPautaDeOutros = (pauta ?? []).some((p) => p.proposto_por !== membro.id);
    if (temPautaDeOutros) {
      throw new Error("Não dá pra excluir: outros membros já adicionaram itens de pauta aqui.");
    }

    const { error: deleteError } = await supabase.from("reunioes").delete().eq("id", reuniao.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await registrarAuditoria({
      orgId: reuniao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: reuniao.id,
      antes: { codigo: reuniao.codigo, titulo: reuniao.titulo },
      depois: null,
    });

    return { id: reuniao.id };
  });
