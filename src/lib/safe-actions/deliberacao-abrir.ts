"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  codigo: z.string().trim().min(1),
  titulo: z.string().trim().min(1),
  corpo: z.string().trim().optional(),
  quorumPct: z.number().min(0.01).max(100),
  encerraEm: z.string().refine((v) => new Date(v) > new Date(), {
    message: "O prazo de encerramento precisa ser no futuro.",
  }),
});

// SA-12 (deliberacao.abrir) — master doc §4: "valida quórum ≤ 100, encerra_em futuro".
// Abre direto em 'aberta' — não existe rascunho de deliberação no fluxo atual, só
// decisão que já está valendo pra votação.
export const abrirDeliberacao = actionClient
  .metadata({ acao: "deliberacao.abrir", entidade: "deliberacoes" })
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

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio abrem deliberações.");
    }

    const { data: deliberacao, error } = await supabase
      .from("deliberacoes")
      .insert({
        org_id: parsedInput.orgId,
        codigo: parsedInput.codigo,
        titulo: parsedInput.titulo,
        corpo: parsedInput.corpo ?? null,
        quorum_pct: parsedInput.quorumPct,
        encerra_em: parsedInput.encerraEm,
        abre_em: new Date().toISOString(),
        status: "aberta",
      })
      .select("id")
      .single();

    if (error || !deliberacao) {
      throw new Error(error?.message ?? "Falha ao abrir a deliberação.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: deliberacao.id,
      antes: null,
      depois: { codigo: parsedInput.codigo, titulo: parsedInput.titulo, quorumPct: parsedInput.quorumPct },
    });

    return { id: deliberacao.id };
  });
