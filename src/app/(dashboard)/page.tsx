import Link from "next/link";
import { ChevronRight, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { Aneis } from "@/components/shell/aneis";

export default async function CockpitPage() {
  const supabase = await createClient();

  const [{ data: fases }, { data: documentos }, { data: registros }] = await Promise.all([
    supabase.from("fases").select("trilho, itens:fase_itens(concluido)"),
    supabase.from("documentos").select("status"),
    supabase
      .from("registros")
      .select("id, codigo, texto_snapshot, guardado_em, guardado_por:membros(nome)")
      .order("guardado_em", { ascending: false })
      .limit(3),
  ]);

  const todasFases = fases ?? [];
  const todosDocumentos = documentos ?? [];

  const tot = todasFases.reduce((acc, f) => acc + f.itens.length, 0);
  const fei = todasFases.reduce((acc, f) => acc + f.itens.filter((i) => i.concluido).length, 0);

  const pctTrilho = (trilho: "legal" | "op") => {
    const grupo = todasFases.filter((f) => f.trilho === trilho);
    const total = grupo.reduce((acc, f) => acc + f.itens.length, 0);
    const feitos = grupo.reduce((acc, f) => acc + f.itens.filter((i) => i.concluido).length, 0);
    return total > 0 ? Math.round((feitos / total) * 100) : 0;
  };

  const docsOk = todosDocumentos.filter((d) => d.status === "assinado").length;

  const progresso = {
    tot,
    fei,
    pct: tot > 0 ? Math.round((fei / tot) * 100) : 0,
    legal: pctTrilho("legal"),
    op: pctTrilho("op"),
    docs: todosDocumentos.length > 0 ? Math.round((docsOk / todosDocumentos.length) * 100) : 0,
    docsOk,
    docsTotal: todosDocumentos.length,
  };

  return (
    <>
      <Titulo t="Visão geral" s="Progresso calculado a partir da trilha e dos documentos reais da org." />

      <section className="cart cart--her">
        <div className="her__aneis">
          <Aneis legal={progresso.legal} docs={progresso.docs} op={progresso.op} />
        </div>
        <div className="her__dados">
          <div className="her__pct">
            {progresso.pct}
            <small>%</small>
          </div>
          <p className="her__leg">
            {progresso.fei} de {progresso.tot} entregas concluídas
          </p>
          <div className="leg">
            {(
              [
                ["a", "Societário e legal", progresso.legal],
                ["b", "Documentos", progresso.docs],
                ["c", "Operação e produto", progresso.op],
              ] as const
            ).map(([k, rotulo, valor]) => (
              <div key={k} className="leg__l">
                <span className={`ponto p--${k}`} />
                <span className="leg__r">
                  {rotulo}
                  {k === "b" && <em>{progresso.docsOk} de {progresso.docsTotal} assinados</em>}
                </span>
                <span className="leg__v">{valor}%</span>
              </div>
            ))}
          </div>
          <Link href="/trilha" className="bt bt--claro">
            Abrir trilha <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      <section className="cart">
        <div className="cart__cab">
          <h2>Livro de registros</h2>
        </div>
        <ul className="lista">
          {(registros ?? []).length === 0 ? (
            <li className="lista__vazio">
              Guarde uma mensagem em Debates para começar o livro. Ele serve de memória das decisões informais.
            </li>
          ) : (
            (registros ?? []).map((r) => (
              <li key={r.id} className="linha">
                <span className="item__ic c-azul">
                  <Bookmark size={14} strokeWidth={2.1} />
                </span>
                <span className="linha__t">
                  {r.texto_snapshot}
                  <em>
                    {r.codigo} · {r.guardado_por?.nome ?? "—"}
                  </em>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </>
  );
}
