"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  nome: z.string().trim().min(1).max(60),
  descricao: z.string().trim().max(200).optional(),
});

function slugificar(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// canal.criar — não numerada no master doc (canais nasciam só via seed). RLS
// (canais_write_admin) já trava em admin; a checagem aqui só existe pra dar mensagem
// amigável em vez do erro cru de RLS.
export const criarCanal = actionClient
  .metadata({ acao: "canal.criar", entidade: "canais" })
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
    if (membro.papel !== "admin") {
      throw new Error("Só admin cria canais.");
    }

    const slug = slugificar(parsedInput.nome);
    if (!slug) {
      throw new Error("Nome de canal inválido.");
    }

    const { data: canal, error } = await supabase
      .from("canais")
      .insert({
        org_id: parsedInput.orgId,
        slug,
        nome: parsedInput.nome,
        descricao: parsedInput.descricao ?? null,
        criado_por: membro.id,
      })
      .select("id")
      .single();

    if (error || !canal) {
      throw new Error(error?.message ?? "Falha ao criar o canal.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: canal.id,
      antes: null,
      depois: { slug, nome: parsedInput.nome },
    });

    return { id: canal.id };
  });
