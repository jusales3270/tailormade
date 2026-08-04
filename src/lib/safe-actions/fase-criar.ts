"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  nome: z.string().trim().min(1).max(80),
  trilho: z.enum(["legal", "op"]),
  // inicio_previsto é opcional no banco, mas a fase sem ele não aparece no Gantt (master
  // doc §2.2: "o gráfico não estima, só desenha o que foi registrado"). O formulário
  // pede os dois; quem não souber a data ainda manda vazio e edita depois.
  inicioPrevisto: z.string().date().nullable(),
  prazo: z.string().date().nullable(),
  responsavelId: z.string().uuid().nullable(),
});

// fase.criar — não existia. A Trilha inteira vinha do seed, que não roda em produção:
// sem esta ação, cadastrar uma fase de fundação exigia SQL direto no banco.
export const criarFase = actionClient
  .metadata({ acao: "fase.criar", entidade: "fases" })
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
      throw new Error("Só admin ou sócio criam fases.");
    }
    if (parsedInput.inicioPrevisto && parsedInput.prazo && parsedInput.prazo < parsedInput.inicioPrevisto) {
      throw new Error("O prazo não pode ser anterior ao início previsto.");
    }

    // ordem é unique(org_id, ordem) e define a sequência da trilha — nasce no fim.
    const { data: ultima } = await supabase
      .from("fases")
      .select("ordem")
      .eq("org_id", parsedInput.orgId)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ordem = (ultima?.ordem ?? 0) + 1;

    const { data: fase, error } = await supabase
      .from("fases")
      .insert({
        org_id: parsedInput.orgId,
        ordem,
        nome: parsedInput.nome,
        trilho: parsedInput.trilho,
        responsavel_id: parsedInput.responsavelId,
        inicio_previsto: parsedInput.inicioPrevisto,
        prazo: parsedInput.prazo,
      })
      .select("id")
      .single();

    if (error || !fase) {
      throw new Error(error?.message ?? "Falha ao criar a fase.");
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: fase.id,
      antes: null,
      depois: { ordem, nome: parsedInput.nome, trilho: parsedInput.trilho },
    });

    return { id: fase.id, ordem };
  });
