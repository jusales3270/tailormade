"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  aporteId: z.string().uuid(),
  valorCents: z.number().int().positive(),
  data: z.string(),
  comprovanteDocumentoId: z.string().uuid(),
});

// SA-22 (aporte.registrar_integralizacao) — master doc §2.6: "Exige
// comprovante_documento_id". Sem comprovante, a Safe Action nem chega a inserir.
export const registrarIntegralizacao = actionClient
  .metadata({ acao: "aporte.registrar_integralizacao", entidade: "aporte_eventos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: aporte, error } = await supabase
      .from("aportes")
      .select("id, org_id")
      .eq("id", parsedInput.aporteId)
      .single();

    if (error || !aporte) {
      throw new Error("Aporte não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", aporte.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro || (membro.papel !== "admin" && membro.papel !== "socio")) {
      throw new Error("Só admin ou sócio pode registrar integralização.");
    }

    const { data: evento, error: insertError } = await supabase
      .from("aporte_eventos")
      .insert({
        aporte_id: parsedInput.aporteId,
        valor_cents: parsedInput.valorCents,
        data: parsedInput.data,
        comprovante_documento_id: parsedInput.comprovanteDocumentoId,
      })
      .select("id")
      .single();

    if (insertError || !evento) {
      throw new Error(insertError?.message ?? "Falha ao registrar a integralização.");
    }

    await registrarAuditoria({
      orgId: aporte.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: evento.id,
      antes: null,
      depois: {
        aporteId: parsedInput.aporteId,
        valorCents: parsedInput.valorCents,
        comprovanteDocumentoId: parsedInput.comprovanteDocumentoId,
      },
    });

    return { id: evento.id };
  });
