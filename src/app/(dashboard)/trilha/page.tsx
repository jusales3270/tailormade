import { createClient } from "@/lib/supabase/server";
import { r01FaseConcluida, r02FaseBloqueada } from "@/lib/regras/status";
import { Titulo } from "@/components/shell/titulo";
import { TrilhaClient } from "./trilha-client";
import type { FaseUI } from "./tipos";

export default async function TrilhaPage() {
  const supabase = await createClient();

  const [{ data: fases }, { data: documentos }] = await Promise.all([
    supabase
      .from("fases")
      .select(
        `id, ordem, nome, trilho, inicio_previsto, prazo,
         responsavel:membros(nome),
         itens:fase_itens(id, ordem, titulo, concluido, depende_documento_id)`,
      )
      .order("ordem")
      .order("ordem", { referencedTable: "fase_itens" }),
    supabase.from("documentos").select("id, status"),
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

  return (
    <>
      <Titulo t="Trilha" s="Cada fase abre a seguinte. Marcar um item aqui move os anéis da visão geral." />
      <TrilhaClient fases={fasesUI} />
    </>
  );
}
