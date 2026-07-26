import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { CofreClient } from "./cofre-client";
import type { DocumentoUI } from "./tipos";

export default async function CofrePage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("id, org_id, papel")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  const { data: documentos } = await supabase
    .from("documentos")
    .select(
      `id, codigo, nome, grupo, status, critico,
       responsavel:membros(nome),
       versoes:documento_versoes(versao, hash_sha256, enviado_em)`,
    )
    .order("codigo");

  const documentosUI: DocumentoUI[] = (documentos ?? []).map((d) => {
    const ultima = (d.versoes ?? []).reduce<(typeof d.versoes)[number] | null>(
      (acc, v) => (!acc || v.versao > acc.versao ? v : acc),
      null,
    );
    return {
      id: d.id,
      codigo: d.codigo,
      nome: d.nome,
      grupo: d.grupo,
      status: d.status,
      critico: d.critico,
      responsavelNome: d.responsavel?.nome ?? null,
      ultimaVersao: ultima?.versao ?? null,
      ultimoHash: ultima?.hash_sha256 ?? null,
      enviadoEm: ultima?.enviado_em ?? null,
    };
  });

  return (
    <>
      <Titulo
        t="Documentos"
        s="Versão, responsável e hash de cada arquivo. O que não existe continua na lista, marcado em vermelho."
      />
      <CofreClient
        documentos={documentosUI}
        orgId={membro?.org_id ?? null}
        podeGerir={membro?.papel === "admin" || membro?.papel === "socio"}
      />
    </>
  );
}
