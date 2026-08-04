"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  faseId: z.string().uuid(),
  nome: z.string().trim().min(1).max(80),
  trilho: z.enum(["legal", "op"]),
  inicioPrevisto: z.string().date().nullable(),
  prazo: z.string().date().nullable(),
  responsavelId: z.string().uuid().nullable(),
});

// fase.editar — absorve SA-07 (fase.reatribuir) do master doc §4, que nunca foi
// implementada como ação própria: trocar o responsável é um campo deste formulário, não
// um fluxo à parte. Também é o único caminho para preencher inicio_previsto/prazo, sem
// os quais a fase não desenha barra no Gantt.
export const editarFase = actionClient
  .metadata({ acao: "fase.editar", entidade: "fases" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: fase, error } = await supabase
      .from("fases")
      .select("id, org_id, nome, trilho, responsavel_id, inicio_previsto, prazo")
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
      throw new Error("Só admin ou sócio editam fases.");
    }
    if (parsedInput.inicioPrevisto && parsedInput.prazo && parsedInput.prazo < parsedInput.inicioPrevisto) {
      throw new Error("O prazo não pode ser anterior ao início previsto.");
    }

    const { error: updateError } = await supabase
      .from("fases")
      .update({
        nome: parsedInput.nome,
        trilho: parsedInput.trilho,
        responsavel_id: parsedInput.responsavelId,
        inicio_previsto: parsedInput.inicioPrevisto,
        prazo: parsedInput.prazo,
      })
      .eq("id", fase.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: fase.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: fase.id,
      antes: {
        nome: fase.nome,
        trilho: fase.trilho,
        responsavel_id: fase.responsavel_id,
        inicio_previsto: fase.inicio_previsto,
        prazo: fase.prazo,
      },
      depois: {
        nome: parsedInput.nome,
        trilho: parsedInput.trilho,
        responsavel_id: parsedInput.responsavelId,
        inicio_previsto: parsedInput.inicioPrevisto,
        prazo: parsedInput.prazo,
      },
    });

    return { id: fase.id };
  });
