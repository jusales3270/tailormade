"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  orgId: z.string().uuid(),
  membroId: z.string().uuid(),
  comprometidoCents: z.number().int().positive(),
  prazo: z.string().date().nullable(),
});

// aporte.criar — o par que faltava de SA-22. Havia como registrar a integralização de um
// aporte, não como declarar o aporte em si: a tabela só era populada pelo seed, que não
// roda em produção. Sem ela, o painel nunca tinha compromisso de capital contra o qual
// comparar o integralizado, e a R07 (aporte em aberto) não tinha o que ler.
//
// comprometido em centavos, bigint no banco (master doc §2.6). O valor é o compromisso
// total do sócio; o que já entrou vive em aporte_eventos, nunca aqui.
export const criarAporte = actionClient
  .metadata({ acao: "aporte.criar", entidade: "aportes" })
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
      throw new Error("Só admin ou sócio declaram aporte.");
    }

    // O aportante precisa ser membro ativo da mesma org — sem isso o formulário aceitaria
    // um uuid de outra organização e a FK deixaria passar.
    const { data: aportante } = await supabase
      .from("membros")
      .select("id, nome")
      .eq("id", parsedInput.membroId)
      .eq("org_id", parsedInput.orgId)
      .eq("ativo", true)
      .maybeSingle();

    if (!aportante) {
      throw new Error("O aportante precisa ser um membro ativo desta organização.");
    }

    const { data: aporte, error } = await supabase
      .from("aportes")
      .insert({
        org_id: parsedInput.orgId,
        membro_id: parsedInput.membroId,
        comprometido_cents: parsedInput.comprometidoCents,
        prazo: parsedInput.prazo,
      })
      .select("id")
      .single();

    if (error || !aporte) {
      // unique (org_id, membro_id): um compromisso por sócio, e ele se ajusta em vez de
      // acumular linhas soltas.
      throw new Error(
        error?.code === "23505"
          ? `${aportante.nome} já tem um aporte declarado. Edite o valor existente.`
          : (error?.message ?? "Falha ao declarar o aporte."),
      );
    }

    await registrarAuditoria({
      orgId: parsedInput.orgId,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: aporte.id,
      antes: null,
      depois: {
        membroId: parsedInput.membroId,
        comprometidoCents: parsedInput.comprometidoCents,
        prazo: parsedInput.prazo,
      },
    });

    return { id: aporte.id };
  });
