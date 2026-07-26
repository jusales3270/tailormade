"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  nome: z.string().trim().min(1),
  grupo: z.string().trim().min(1),
  critico: z.boolean().default(false),
});

// SA-08 (documento.criar) — master doc §4: "Aceita criação com status='ausente'". O
// documento existe como registro antes de existir arquivo — é o que faz um documento
// crítico nunca enviado aparecer marcado, em vez de simplesmente não existir.
export const criarDocumento = actionClient
  .metadata({ acao: "documento.criar", entidade: "documentos" })
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
      throw new Error("Só admin ou sócio criam documentos.");
    }

    const { count } = await supabase
      .from("documentos")
      .select("id", { count: "exact", head: true })
      .eq("org_id", parsedInput.orgId);
    const codigo = `DOC-${String((count ?? 0) + 1).padStart(2, "0")}`;

    const { data: documento, error } = await supabase
      .from("documentos")
      .insert({
        org_id: parsedInput.orgId,
        codigo,
        nome: parsedInput.nome,
        grupo: parsedInput.grupo,
        critico: parsedInput.critico,
        status: "ausente",
      })
      .select("id")
      .single();

    if (error || !documento) {
      throw new Error(error?.message ?? "Falha ao criar o documento.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: documento.id,
      antes: null,
      depois: { codigo, nome: parsedInput.nome, grupo: parsedInput.grupo },
    });

    return { id: documento.id };
  });
