"use server";

import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  reuniaoId: z.string().uuid(),
  titulo: z.string().trim().min(1),
  tipo: z.string().trim().min(1),
  inicio: z.string(),
});

// reuniao.editar — só quem marcou a reunião, e só antes da ata publicada. Depois da
// ata a reunião já é registro de governança (a ata referencia "esta reunião" pelo
// título/data que ela tinha no momento) — mudar isso depois seria reescrever o
// contexto de uma decisão já tomada.
export const editarReuniao = actionClient
  .metadata({ acao: "reuniao.editar", entidade: "reunioes" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;

    const { data: reuniao, error } = await supabase
      .from("reunioes")
      .select("id, org_id, criado_por, titulo, tipo, inicio")
      .eq("id", parsedInput.reuniaoId)
      .single();

    if (error || !reuniao) {
      throw new Error("Reunião não encontrada ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", reuniao.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (!reuniao.criado_por || reuniao.criado_por !== membro.id) {
      throw new Error("Só quem marcou esta reunião pode editá-la.");
    }

    const { count: ataCount } = await supabase
      .from("atas")
      .select("reuniao_id", { count: "exact", head: true })
      .eq("reuniao_id", reuniao.id);

    if ((ataCount ?? 0) > 0) {
      throw new Error("Não dá pra editar: esta reunião já tem ata publicada.");
    }

    const { error: updateError } = await supabase
      .from("reunioes")
      .update({ titulo: parsedInput.titulo, tipo: parsedInput.tipo, inicio: parsedInput.inicio })
      .eq("id", reuniao.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await registrarAuditoria({
      orgId: reuniao.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: reuniao.id,
      antes: { titulo: reuniao.titulo, tipo: reuniao.tipo, inicio: reuniao.inicio },
      depois: { titulo: parsedInput.titulo, tipo: parsedInput.tipo, inicio: parsedInput.inicio },
    });

    return { id: reuniao.id };
  });
