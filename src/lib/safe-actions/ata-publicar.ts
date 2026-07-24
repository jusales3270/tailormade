"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  reuniaoId: z.string().uuid(),
  corpo: z.string().trim().min(1),
  encaminhamentos: z.array(
    z.object({
      titulo: z.string().trim().min(1),
      responsavelId: z.string().uuid().nullable(),
      prazo: z.string(),
    }),
  ),
});

// SA-17 (ata.publicar) — master doc §4: "Fail-closed: recusa se algum encaminhamento
// estiver sem responsável". Os encaminhamentos discutidos na reunião entram junto com a
// ata (não existem antes dela); se um só estiver com responsavelId nulo, NADA é
// publicado — nem a ata, nem os encaminhamentos que já tinham responsável definido.
export const publicarAta = actionClient
  .metadata({ acao: "ata.publicar", entidade: "atas" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const semResponsavel = parsedInput.encaminhamentos.filter((e) => !e.responsavelId);
    if (semResponsavel.length > 0) {
      throw new Error(
        `Não dá pra publicar: ${semResponsavel.length} encaminhamento(s) sem responsável (${semResponsavel
          .map((e) => e.titulo)
          .join(", ")}).`,
      );
    }

    const { data: reuniao, error: reuniaoError } = await supabase
      .from("reunioes")
      .select("id, org_id")
      .eq("id", parsedInput.reuniaoId)
      .single();

    if (reuniaoError || !reuniao) {
      throw new Error("Reunião não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", reuniao.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel !== "admin" && membro.papel !== "socio") {
      throw new Error("Só admin ou sócio publicam ata.");
    }

    const { data: ata, error: ataError } = await supabase
      .from("atas")
      .insert({
        reuniao_id: reuniao.id,
        corpo: parsedInput.corpo,
        publicada_em: new Date().toISOString(),
        publicada_por: membro.id,
      })
      .select("id, hash")
      .single();

    if (ataError || !ata) {
      throw new Error(ataError?.message ?? "Falha ao publicar a ata.");
    }

    if (parsedInput.encaminhamentos.length > 0) {
      const { error: encError } = await supabase.from("encaminhamentos").insert(
        parsedInput.encaminhamentos.map((e) => ({
          org_id: reuniao.org_id,
          titulo: e.titulo,
          responsavel_id: e.responsavelId as string,
          prazo: e.prazo,
          origem_tipo: "reuniao",
          origem_id: reuniao.id,
        })),
      );

      if (encError) {
        throw new Error(`Ata publicada, mas falha ao criar os encaminhamentos: ${encError.message}`);
      }
    }

    await registrarAuditoria({
      orgId: reuniao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: ata.id,
      antes: null,
      depois: { hash: ata.hash, encaminhamentos: parsedInput.encaminhamentos.length },
    });

    return { id: ata.id, hash: ata.hash };
  });
