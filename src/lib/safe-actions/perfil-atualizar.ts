"use server";

import { z } from "zod";
import { actionClient } from "./client";

const schema = z.object({
  nomeExibicao: z.string().trim().min(1).max(120).optional(),
  avatar: z.instanceof(File).optional(),
  novaSenha: z.string().min(8).optional(),
});

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Perfil (nome de exibição, avatar, senha) é dado pessoal do usuário — não é
// membros.nome (compartilhado com o resto da org) nem passa por auditoria, que é só
// para ações que afetam registros da organização. Fica só em auth.users.user_metadata.
export const atualizarPerfil = actionClient
  .metadata({ acao: "perfil.atualizar", entidade: "auth.users" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { nomeExibicao, avatar, novaSenha } = parsedInput;

    if (!nomeExibicao && !avatar && !novaSenha) {
      throw new Error("Nada para atualizar.");
    }

    const data: Record<string, string> = {};

    if (nomeExibicao) {
      data.nome_exibicao = nomeExibicao;
    }

    if (avatar) {
      const extensao = EXTENSAO_POR_TIPO[avatar.type] ?? "jpg";
      const caminho = `${userId}/avatar.${extensao}`;
      const bytes = Buffer.from(await avatar.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(caminho, bytes, { contentType: avatar.type || "image/jpeg", upsert: true });

      if (uploadError) {
        throw new Error(`Falha ao enviar o avatar: ${uploadError.message}`);
      }

      data.avatar_path = caminho;
    }

    const { error } = await supabase.auth.updateUser({
      ...(novaSenha ? { password: novaSenha } : {}),
      ...(Object.keys(data).length > 0 ? { data } : {}),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true as const };
  });
