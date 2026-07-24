"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";
import { r03DeliberacaoAprovada } from "@/lib/regras/status";

const schema = z.object({
  deliberacaoId: z.string().uuid(),
  voto: z.enum(["sim", "nao", "abstencao"]),
  justificativa: z.string().trim().optional(),
});

// SA-13 (voto.registrar) — master doc §4: "um por membro, só socio, append-only,
// recalcula status". peso_pct é o snapshot da participação do votante agora — a cadeia
// de hash (hash_anterior/hash) é calculada por trigger no banco, não aqui (ver migration
// voto_cadeia_hash: evita corrida entre votos concorrentes na mesma deliberação).
export const registrarVoto = actionClient
  .metadata({ acao: "voto.registrar", entidade: "votos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: deliberacao, error } = await supabase
      .from("deliberacoes")
      .select("id, org_id, status, quorum_pct")
      .eq("id", parsedInput.deliberacaoId)
      .single();

    if (error || !deliberacao) {
      throw new Error("Deliberação não encontrada ou sem acesso.");
    }
    if (deliberacao.status !== "aberta") {
      throw new Error("Esta deliberação não está aberta para votos.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel, participacao_pct")
      .eq("user_id", userId)
      .eq("org_id", deliberacao.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio votam.");
    }

    const { error: insertError } = await supabase.from("votos").insert({
      deliberacao_id: deliberacao.id,
      membro_id: membro.id,
      voto: parsedInput.voto,
      peso_pct: membro.participacao_pct,
      justificativa: parsedInput.justificativa ?? null,
    });

    if (insertError) {
      throw new Error(insertError.code === "23505" ? "Você já votou nesta deliberação." : insertError.message);
    }

    const { data: todosVotos } = await supabase
      .from("votos")
      .select("membro_id, voto, peso_pct")
      .eq("deliberacao_id", deliberacao.id);

    const aprovada = r03DeliberacaoAprovada({
      id: deliberacao.id,
      codigo: "",
      titulo: "",
      quorumPct: deliberacao.quorum_pct,
      encerraEm: null,
      votos: (todosVotos ?? []).map((v) => ({
        membroId: v.membro_id,
        voto: v.voto,
        pesoPct: v.peso_pct,
      })),
    });

    if (aprovada) {
      await supabase.from("deliberacoes").update({ status: "aprovada" }).eq("id", deliberacao.id);
    }

    await registrarAuditoria({
      orgId: deliberacao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: deliberacao.id,
      antes: null,
      depois: { voto: parsedInput.voto, pesoPct: membro.participacao_pct },
    });

    return { aprovada };
  });
