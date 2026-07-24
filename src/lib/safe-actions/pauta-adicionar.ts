"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  reuniaoId: z.string().uuid(),
  item: z.string().trim().min(1),
});

// SA-16 (pauta.adicionar) — master doc §4: "Qualquer membro ativo" (não precisa ser
// admin/socio, diferente de reuniao.marcar).
export const adicionarPauta = actionClient
  .metadata({ acao: "pauta.adicionar", entidade: "reuniao_pauta" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: reuniao, error } = await supabase
      .from("reunioes")
      .select("id, org_id")
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

    const { data: ultimoItem } = await supabase
      .from("reuniao_pauta")
      .select("ordem")
      .eq("reuniao_id", reuniao.id)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ordem = (ultimoItem?.ordem ?? 0) + 1;

    const { data: pautaItem, error: insertError } = await supabase
      .from("reuniao_pauta")
      .insert({ reuniao_id: reuniao.id, ordem, item: parsedInput.item, proposto_por: membro.id })
      .select("id")
      .single();

    if (insertError || !pautaItem) {
      throw new Error(insertError?.message ?? "Falha ao adicionar o item de pauta.");
    }

    await registrarAuditoria({
      orgId: reuniao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: pautaItem.id,
      antes: null,
      depois: { item: parsedInput.item, ordem },
    });

    return { id: pautaItem.id };
  });
