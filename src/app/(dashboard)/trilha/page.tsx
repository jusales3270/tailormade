import { createClient } from "@/lib/supabase/server";
import { r01FaseConcluida, r02FaseBloqueada } from "@/lib/regras/status";
import { Titulo } from "@/components/shell/titulo";
import { TrilhaClient } from "./trilha-client";
import type { FaseUI, MembroOpcaoUI } from "./tipos";

export default async function TrilhaPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const [{ data: membro }, { data: fases }, { data: documentos }, { data: membros }] =
    await Promise.all([
      supabase
        .from("membros")
        .select("id, org_id, papel")
        .eq("user_id", sessao!.claims.sub)
        .eq("ativo", true)
        .maybeSingle(),
      supabase
        .from("fases")
        .select(
          `id, ordem, nome, trilho, inicio_previsto, prazo, responsavel_id,
           responsavel:membros(nome),
           itens:fase_itens(id, ordem, titulo, concluido, depende_documento_id)`,
        )
        .order("ordem")
        .order("ordem", { referencedTable: "fase_itens" }),
      supabase.from("documentos").select("id, status"),
      supabase.from("membros").select("id, nome").eq("ativo", true).order("nome"),
    ]);

  const documentosPorId = new Map((documentos ?? []).map((d) => [d.id, { status: d.status }]));

  const fasesUI: FaseUI[] = (fases ?? []).map((fase) => {
    const itensParaRegra = (fase.itens ?? []).map((item) => ({
      id: item.id,
      concluido: item.concluido,
      dependeDocumentoId: item.depende_documento_id,
    }));
    const faseParaRegra = { id: fase.id, nome: fase.nome, itens: itensParaRegra };

    return {
      id: fase.id,
      ordem: fase.ordem,
      nome: fase.nome,
      trilho: fase.trilho,
      responsavelId: fase.responsavel_id,
      responsavelNome: fase.responsavel?.nome ?? null,
      inicioPrevisto: fase.inicio_previsto,
      prazo: fase.prazo,
      concluida: r01FaseConcluida(faseParaRegra),
      bloqueada: r02FaseBloqueada(faseParaRegra, documentosPorId),
      itens: (fase.itens ?? [])
        .slice()
        .sort((a, b) => a.ordem - b.ordem)
        .map((item) => ({ id: item.id, titulo: item.titulo, concluido: item.concluido })),
    };
  });

  const membrosUI: MembroOpcaoUI[] = (membros ?? []).map((m) => ({ id: m.id, nome: m.nome }));

  return (
    <>
      <Titulo t="Trilha" s="Cada fase abre a seguinte. Marcar um item aqui move os anéis da visão geral." />
      <TrilhaClient
        fases={fasesUI}
        membros={membrosUI}
        orgId={membro?.org_id ?? null}
        podeGerir={membro?.papel === "admin" || membro?.papel === "socio"}
      />
    </>
  );
}
