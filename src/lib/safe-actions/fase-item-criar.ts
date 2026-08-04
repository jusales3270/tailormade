"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseId: z.string().uuid(),
  titulo: z.string().trim().min(1).max(160),
});

// fase_item.criar — o par que faltava de SA-05/SA-06. Havia como concluir e reabrir um
// item, não como cadastrar um: o checklist das fases vinha inteiro do seed.
export const criarFaseItem = actionClient
  .metadata({ acao: "fase_item.criar", entidade: "fase_itens" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: fase, error } = await supabase
      .from("fases")
      .select("id, org_id")
      .eq("id", parsedInput.faseId)
      .single();

    if (error || !fase) {
      throw new Error("Fase não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", fase.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio adicionam itens à trilha.");
    }

    // ordem é unique(fase_id, ordem) — o item novo entra no fim da fase.
    const { data: ultimo } = await supabase
      .from("fase_itens")
      .select("ordem")
      .eq("fase_id", fase.id)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ordem = (ultimo?.ordem ?? 0) + 1;

    const { data: item, error: insertError } = await supabase
      .from("fase_itens")
      .insert({ fase_id: fase.id, ordem, titulo: parsedInput.titulo, concluido: false })
      .select("id")
      .single();

    if (insertError || !item) {
      throw new Error(insertError?.message ?? "Falha ao adicionar o item.");
    }

    await registrarAuditoria({
      orgId: fase.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: item.id,
      antes: null,
      depois: { faseId: fase.id, ordem, titulo: parsedInput.titulo },
    });

    return { id: item.id, ordem };
  });
