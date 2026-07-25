"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  deliberacaoId: z.string().uuid(),
  distribuicao: z
    .array(z.object({ membroId: z.string().uuid(), participacaoPct: z.number().min(0).max(100) }))
    .min(1),
});

const EPSILON = 0.01;

// SA-25 (participacao.aplicar) — master doc §2.1/§4: "participacao_pct não é editável por
// formulário... a única porta é uma deliberação aprovada, e a ação verifica isso no
// servidor". Duas travas além da literal do doc, necessárias para a frase acima ser
// verdade na prática (não só no primeiro uso): (1) participacao_aplicada_em impede
// reaplicar a mesma deliberação com uma distribuição diferente depois; (2) a distribuição
// enviada precisa cobrir exatamente todo o quadro ativo da org e somar 100%, senão a
// participação registrada deixa de bater com a realidade societária.
export const aplicarParticipacao = actionClient
  .metadata({ acao: "participacao.aplicar", entidade: "membros" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", parsedInput.orgId)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro || membro.papel !== "admin") {
      throw new Error("Só admin pode aplicar participação.");
    }

    const { data: deliberacao, error } = await supabase
      .from("deliberacoes")
      .select("id, status, participacao_aplicada_em")
      .eq("id", parsedInput.deliberacaoId)
      .eq("org_id", parsedInput.orgId)
      .single();

    if (error || !deliberacao) {
      throw new Error("Deliberação não encontrada ou sem acesso.");
    }
    if (deliberacao.status !== "aprovada") {
      throw new Error("Só uma deliberação aprovada pode alterar a participação societária.");
    }
    if (deliberacao.participacao_aplicada_em) {
      throw new Error("Esta deliberação já aplicou uma mudança de participação.");
    }

    const { data: membrosAtivos } = await supabase
      .from("membros")
      .select("id, participacao_pct")
      .eq("org_id", parsedInput.orgId)
      .eq("ativo", true);

    const idsAtivos = new Set((membrosAtivos ?? []).map((m) => m.id));
    const idsEnviados = new Set(parsedInput.distribuicao.map((d) => d.membroId));
    const cobreTodoMundo =
      idsAtivos.size === idsEnviados.size && [...idsAtivos].every((id) => idsEnviados.has(id));

    if (!cobreTodoMundo) {
      throw new Error("A distribuição precisa cobrir todos os membros ativos da organização.");
    }

    const soma = parsedInput.distribuicao.reduce((acc, d) => acc + d.participacaoPct, 0);
    if (Math.abs(soma - 100) > EPSILON) {
      throw new Error(`A soma das participações precisa ser 100% (está em ${soma.toFixed(2)}%).`);
    }

    const antes = Object.fromEntries((membrosAtivos ?? []).map((m) => [m.id, m.participacao_pct]));

    for (const item of parsedInput.distribuicao) {
      const { error: updateError } = await supabase
        .from("membros")
        .update({ participacao_pct: item.participacaoPct })
        .eq("id", item.membroId);
      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    await supabase
      .from("deliberacoes")
      .update({ participacao_aplicada_em: new Date().toISOString() })
      .eq("id", deliberacao.id);

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: deliberacao.id,
      antes,
      depois: Object.fromEntries(parsedInput.distribuicao.map((d) => [d.membroId, d.participacaoPct])),
    });

    return { aplicado: true };
  });
