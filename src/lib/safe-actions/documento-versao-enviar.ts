"use server";

import { createHash } from "crypto";
import { z } from "zod";
import { actionClient } from "./client";
import { registrarAuditoria } from "./auditoria";

const schema = z.object({
  documentoId: z.string().uuid(),
  arquivo: z.instanceof(File),
});

// SA-09 (documento_versao.enviar) — master doc §4: "Calcula SHA-256, incrementa versão,
// nunca sobrescreve". O caminho no storage inclui a versão no nome — reenviar sempre
// cria um objeto novo, nunca troca o v1 de lugar.
export const enviarDocumentoVersao = actionClient
  .metadata({ acao: "documento_versao.enviar", entidade: "documento_versoes" })
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx, metadata }) => {
    const { supabase, userId } = ctx;
    const { documentoId, arquivo } = parsedInput;

    const { data: documento, error: docError } = await supabase
      .from("documentos")
      .select("id, org_id, status")
      .eq("id", documentoId)
      .single();

    if (docError || !documento) {
      throw new Error("Documento não encontrado ou sem acesso.");
    }

    const { data: membro } = await supabase
      .from("membros")
      .select("id, papel")
      .eq("user_id", userId)
      .eq("org_id", documento.org_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!membro) {
      throw new Error("Você não é membro ativo desta organização.");
    }
    if (membro.papel === "convidado") {
      throw new Error("Convidado não envia versão de documento.");
    }

    // max(versao), não count(*): o seed só grava a versão mais recente de cada
    // documento (não 1..N sequencial), então contar linhas colide com o número real.
    const { data: ultimaVersao } = await supabase
      .from("documento_versoes")
      .select("versao")
      .eq("documento_id", documentoId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();

    const versao = (ultimaVersao?.versao ?? 0) + 1;

    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const hashSha256 = createHash("sha256").update(bytes).digest("hex");

    const nomeArquivo = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${documentoId}/v${versao}-${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(storagePath, bytes, { contentType: arquivo.type || "application/octet-stream" });

    if (uploadError) {
      throw new Error(`Falha ao enviar o arquivo: ${uploadError.message}`);
    }

    const { data: versaoRow, error: insertError } = await supabase
      .from("documento_versoes")
      .insert({
        documento_id: documentoId,
        versao,
        storage_path: storagePath,
        hash_sha256: hashSha256,
        enviado_por: membro.id,
      })
      .select("id")
      .single();

    if (insertError || !versaoRow) {
      // Upload e INSERT não compartilham transação — sem isso o arquivo fica órfão no
      // storage sem nenhuma linha em documento_versoes apontando pra ele.
      await supabase.storage.from("documentos").remove([storagePath]);
      throw new Error(insertError?.message ?? "Falha ao registrar a versão.");
    }

    if (documento.status === "ausente") {
      await supabase.from("documentos").update({ status: "rascunho" }).eq("id", documentoId);
    }

    await registrarAuditoria({
      orgId: documento.org_id,
      atorId: membro.id,
      acao: metadata.acao,
      entidade: metadata.entidade,
      entidadeId: versaoRow.id,
      antes: null,
      depois: { versao, hashSha256, storagePath },
    });

    return { versao, hashSha256 };
  });
