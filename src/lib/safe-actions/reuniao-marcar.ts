"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  titulo: z.string().trim().min(1),
  tipo: z.string().trim().min(1),
  inicio: z.string(),
  link: z.string().trim().optional(),
});

// SA-15 (reuniao.marcar) — master doc §4 não lista guard além do padrão de admin/socio
// já usado pra config de governança (mesma policy de reunioes_write).
export const marcarReuniao = actionClient
  .metadata({ acao: "reuniao.marcar", entidade: "reunioes" })
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
      throw new Error("Só admin ou sócio marcam reuniões.");
    }

    // codigo é gerado aqui (não vem do formulário) pra não depender do cliente acertar
    // um valor único — count() em vez de max() porque "R-NNN" não tem parte numérica
    // extraível de forma confiável (podem existir reuniões antigas fora do padrão).
    const { count } = await supabase
      .from("reunioes")
      .select("id", { count: "exact", head: true })
      .eq("org_id", parsedInput.orgId);
    const codigo = `R-${String((count ?? 0) + 1).padStart(3, "0")}`;

    const { data: reuniao, error } = await supabase
      .from("reunioes")
      .insert({
        org_id: parsedInput.orgId,
        codigo,
        titulo: parsedInput.titulo,
        tipo: parsedInput.tipo,
        inicio: parsedInput.inicio,
        link: parsedInput.link ?? null,
      })
      .select("id")
      .single();

    if (error || !reuniao) {
      throw new Error(error?.message ?? "Falha ao marcar a reunião.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: reuniao.id,
      antes: null,
      depois: { codigo, titulo: parsedInput.titulo, inicio: parsedInput.inicio },
    });

    return { id: reuniao.id };
  });
