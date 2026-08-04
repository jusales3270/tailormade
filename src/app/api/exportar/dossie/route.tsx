import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  DossiePdf,
  type AssinaturaDossie,
  type AtaDossie,
  type DocumentoDossie,
  type DossieDados,
  type FaseDossie,
} from "@/lib/exportar/dossie-pdf";

// T-019: dossiê da org em PDF — critério de aceite: "PDF com trilha, atas e
// assinaturas". Exportação formal/de governança, por isso restrita a admin (mesmo
// critério do export de auditoria), independente do RLS de cada tabela individual ser
// mais permissivo.
export async function GET() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("org_id, papel")
    .eq("user_id", sessao.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro || membro.papel !== "admin") {
    return new Response("Só admin pode exportar o dossiê.", { status: 403 });
  }

  const { data: org } = await supabase.from("orgs").select("nome").eq("id", membro.org_id).single();

  const [{ data: fases }, { data: atas }, { data: documentos }] = await Promise.all([
    supabase
      .from("fases")
      .select("nome, trilho, ordem, responsavel:membros(nome), itens:fase_itens(concluido)")
      .eq("org_id", membro.org_id)
      .order("ordem"),
    supabase
      .from("atas")
      .select("corpo, publicada_em, reuniao:reunioes!inner(codigo, titulo, org_id)")
      .eq("reuniao.org_id", membro.org_id)
      .not("publicada_em", "is", null)
      .order("publicada_em"),
    supabase
      .from("documentos")
      .select(
        `codigo, nome, status, critico,
         versoes:documento_versoes(versao, assinaturas(status, assinado_em, membro:membros(nome)))`,
      )
      .eq("org_id", membro.org_id)
      .order("codigo"),
  ]);

  const fasesDossie: FaseDossie[] = (fases ?? []).map((f) => ({
    nome: f.nome,
    trilho: f.trilho,
    concluidos: f.itens.filter((i) => i.concluido).length,
    total: f.itens.length,
    responsavelNome: f.responsavel?.nome ?? null,
  }));

  const atasDossie: AtaDossie[] = (atas ?? []).map((a) => ({
    reuniaoCodigo: a.reuniao.codigo,
    reuniaoTitulo: a.reuniao.titulo,
    corpo: a.corpo,
    publicadaEm: a.publicada_em,
  }));

  const documentosDossie: DocumentoDossie[] = (documentos ?? []).map((d) => {
    const ultimaVersao = d.versoes.reduce<(typeof d.versoes)[number] | null>(
      (acc, v) => (!acc || v.versao > acc.versao ? v : acc),
      null,
    );
    const assinaturas: AssinaturaDossie[] = (ultimaVersao?.assinaturas ?? []).map((a) => ({
      membroNome: a.membro?.nome ?? "?",
      status: a.status,
      assinadoEm: a.assinado_em,
    }));
    return {
      codigo: d.codigo,
      nome: d.nome,
      status: d.status,
      critico: d.critico,
      versao: ultimaVersao?.versao ?? null,
      assinaturas,
    };
  });

  const dados: DossieDados = {
    orgNome: org?.nome ?? "—",
    geradoEm: new Date().toISOString(),
    fases: fasesDossie,
    atas: atasDossie,
    documentos: documentosDossie,
  };

  const buffer = await renderToBuffer(<DossiePdf dados={dados} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossie-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
