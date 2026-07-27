"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";
import { CATEGORIAS_MOVIMENTO } from "@/lib/financeiro/categorias";

const schema = z.object({
  orgId: z.string().uuid(),
  descricao: z.string().trim().min(1),
  valorCents: z.number().int().positive(),
  categoria: z.enum(CATEGORIAS_MOVIMENTO),
  direcao: z.enum(["entrada", "saida"]),
  competencia: z.string().nullable(),
});

// SA-20 (movimento.lancar) — master doc §2.6/§8: nasce sempre em aguarda_aprovacao,
// não há alçada por valor. Só admin/socio (RLS movimentos_write já trava isso).
export const lancarMovimento = actionClient
  .metadata({ acao: "movimento.lancar", entidade: "movimentos" })
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

    if (!membro || (membro.papel !== "admin" && membro.papel !== "socio")) {
      throw new Error("Só admin ou sócio pode lançar movimentos.");
    }

    // codigo é gerado aqui, não pedido no formulário: era um campo obrigatório que o
    // usuário tinha que inventar ("E-019"), e esquecer dele fazia o submit não fazer
    // nada. Mesmo padrão de reuniao.marcar (R-NNN) e documento.criar (DOC-NN).
    const { count } = await supabase
      .from("movimentos")
      .select("id", { count: "exact", head: true })
      .eq("org_id", parsedInput.orgId);
    const codigo = `E-${String((count ?? 0) + 1).padStart(3, "0")}`;

    const { data: movimento, error } = await supabase
      .from("movimentos")
      .insert({
        org_id: parsedInput.orgId,
        codigo,
        descricao: parsedInput.descricao,
        valor_cents: parsedInput.valorCents,
        categoria: parsedInput.categoria,
        direcao: parsedInput.direcao,
        status: "aguarda_aprovacao",
        solicitante_id: membro.id,
        competencia: parsedInput.competencia,
      })
      .select("id")
      .single();

    if (error || !movimento) {
      throw new Error(error?.message ?? "Falha ao lançar o movimento.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: movimento.id,
      antes: null,
      depois: {
        codigo,
        descricao: parsedInput.descricao,
        valorCents: parsedInput.valorCents,
        categoria: parsedInput.categoria,
        direcao: parsedInput.direcao,
      },
    });

    return { id: movimento.id };
  });
