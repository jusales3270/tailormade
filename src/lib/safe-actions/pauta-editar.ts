"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  pautaItemId: z.string().uuid(),
  item: z.string().trim().min(1),
});

// pauta.editar — só quem propôs o item (proposto_por), e só antes da ata publicada.
export const editarPauta = actionClient
  .metadata({ acao: "pauta.editar", entidade: "reuniao_pauta" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: pautaItem, error } = await supabase
      .from("reuniao_pauta")
      .select("id, item, proposto_por, reuniao:reunioes(id, org_id)")
      .eq("id", parsedInput.pautaItemId)
      .single();

    if (error || !pautaItem || !pautaItem.reuniao) {
      throw new Error("Item de pauta não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", pautaItem.reuniao.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (!pautaItem.proposto_por || pautaItem.proposto_por !== membro.id) {
      throw new Error("Só quem propôs este item de pauta pode editá-lo.");
    }

    const { count: ataCount } = await supabase
      .from("atas")
      .select("reuniao_id", { count: "exact", head: true })
      .eq("reuniao_id", pautaItem.reuniao.id);

    if ((ataCount ?? 0) > 0) {
      throw new Error("Não dá pra editar: a ata desta reunião já foi publicada.");
    }

    const { error: updateError } = await supabase
      .from("reuniao_pauta")
      .update({ item: parsedInput.item })
      .eq("id", pautaItem.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: pautaItem.reuniao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: pautaItem.id,
      antes: { item: pautaItem.item },
      depois: { item: parsedInput.item },
    });

    return { id: pautaItem.id };
  });
