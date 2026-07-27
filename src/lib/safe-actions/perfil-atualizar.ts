"use server";

import { z } from "zod";
import { actionClient } from "./client";

const schema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  avatar: z.instanceof(File).optional(),
  novaSenha: z.string().min(8).optional(),
});

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Nome e foto vão para `membros` — que todo mundo da organização enxerga —, não para
// auth.users.user_metadata, que só o próprio dono lê. Um avatar que ninguém além de
// você vê não serve para nada. Só a senha continua no auth, que é onde ela vive.
export const atualizarPerfil = actionClient
  .metadata({ acao: "perfil.atualizar", entidade: "membros" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { nome, avatar, novaSenha } = parsedInput;

    if (!nome && !avatar && !novaSenha) {
      throw new Error("Nada para atualizar.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, nome, avatar_path")
      .eq("user_id", userId)
      .eq("ativo", true)
      .maybeSingle();

    const atualizacao: { nome?: string; avatar_path?: string } = {};

    if (nome) {
      atualizacao.nome = nome;
    }

    if (avatar) {
      if (!membro) {
        throw new Error("Sua conta ainda não está ligada a um membro ativo.");
      }
      const extensao = EXTENSAO_POR_TIPO[avatar.type] ?? "jpg";
      // Caminho continua sob {user_id}/: é o que as policies de escrita do bucket usam
      // para garantir que ninguém sobrescreve a foto de outra pessoa.
      const caminho = `${userId}/avatar.${extensao}`;
      const bytes = Buffer.from(await avatar.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(caminho, bytes, { contentType: avatar.type || "image/jpeg", upsert: true });

      if (uploadError) {
        throw new Error(`Falha ao enviar a foto: ${uploadError.message}`);
      }

      atualizacao.avatar_path = caminho;
    }

    if (Object.keys(atualizacao).length > 0) {
      if (!membro) {
        throw new Error("Sua conta ainda não está ligada a um membro ativo.");
      }
      // Via RPC, não UPDATE direto: membros_update_admin só deixa admin escrever na
      // tabela, e afrouxar isso deixaria qualquer sócio mudar o próprio papel. A função
      // toca só nome/avatar_path da própria linha. Manda sempre os dois valores finais
      // (o atual quando o campo não mudou) porque a assinatura gerada exige ambos.
      const { error } = await supabase.rpc("atualizar_meu_perfil", {
        novo_nome: atualizacao.nome ?? membro.nome,
        novo_avatar_path: atualizacao.avatar_path ?? membro.avatar_path ?? "",
      });
      if (error) {
        throw new Error(error.message);
      }
    }

    if (novaSenha) {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        throw new Error(error.message);
      }
    }

    return { ok: true as const };
  });
