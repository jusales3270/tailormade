"use server";

import { z } from "zod";
import { actionClient } from "./client";

const schema = z.object({
  avisoChave: z.string().trim().min(1).max(120),
  lido: z.boolean(),
});

// Leitura de aviso é estado pessoal: não passa por auditoria (não muda registro da
// organização, só marca o que este membro já viu) e a RLS de avisos_lidos garante que
// ninguém marca por outro. Sem linha na tabela = não lido, por isso desmarcar é DELETE.
export const marcarAvisoLido = actionClient
  .metadata({ acao: "aviso.marcar_lido", entidade: "avisos_lidos" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;

    const { data: membro } = await supabase
      .from("membros")
      .select("id")
      .eq("user_id", userId)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Sua conta ainda não está ligada a um membro ativo.");
    }

    if (parsedInput.lido) {
      const { error } = await supabase
        .from("avisos_lidos")
        .upsert(
          { membro_id: membro.id, aviso_chave: parsedInput.avisoChave },
          { onConflict: "membro_id,aviso_chave" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("avisos_lidos")
        .delete()
        .eq("membro_id", membro.id)
        .eq("aviso_chave", parsedInput.avisoChave);
      if (error) throw new Error(error.message);
    }

    return { chave: parsedInput.avisoChave, lido: parsedInput.lido };
  });
