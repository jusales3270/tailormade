import { ItemLinha } from "./item-linha";
import type { FaseUI } from "./tipos";

export function FaseCard({ fase, indice }: { fase: FaseUI; indice: number }) {
  const feitos = fase.itens.filter((i) => i.concluido).length;
  const total = fase.itens.length;
  const pct = total > 0 ? (feitos / total) * 100 : 0;

  return (
    <section className={`cart fase ${fase.concluida ? "fase--ok" : ""} ${fase.bloqueada ? "fase--bloqueada" : ""}`}>
      <div className="fase__cab">
        <span className="fase__n">{indice + 1}</span>
        <div className="fase__ti">
          <h3>{fase.nome}</h3>
          <em>
            {fase.responsavelNome ?? "sem responsável"} · {fase.prazo ?? "sem prazo"}
          </em>
        </div>
        {fase.bloqueada && <span className="selo selo--vermelho">bloqueada</span>}
        <span className={`selo ${fase.concluida ? "selo--verde" : "selo--cinza"}`}>
          {feitos}/{total}
        </span>
      </div>
      <div className="cap">
        <div className={fase.concluida ? "f-verde" : "f-azul"} style={{ width: `${pct}%` }} />
      </div>
      <ul className="lista">
        {fase.itens.map((item) => (
          <ItemLinha key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
