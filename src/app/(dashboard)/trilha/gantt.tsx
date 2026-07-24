import type { FaseUI } from "./tipos";

// Mesma fonte de dados da Trilha, como linha do tempo em vez de lista vertical (master
// doc §2.2). Fase sem inicio_previsto/prazo não aparece na barra — o gráfico não
// estima, só desenha o que foi registrado; em vez disso vira um aviso de texto.
export function Gantt({ fases }: { fases: FaseUI[] }) {
  const comDatas = fases.filter((f) => f.inicioPrevisto && f.prazo);
  const semDatas = fases.filter((f) => !f.inicioPrevisto || !f.prazo);

  if (comDatas.length === 0) {
    return <p className="cart">Nenhuma fase tem início e prazo registrados ainda.</p>;
  }

  const inicioGlobal = Math.min(...comDatas.map((f) => new Date(f.inicioPrevisto!).getTime()));
  const fimGlobal = Math.max(...comDatas.map((f) => new Date(f.prazo!).getTime()));
  const duracaoGlobal = fimGlobal - inicioGlobal;

  return (
    <section className="cart">
      <div className="gantt">
        {comDatas.map((fase) => {
          const inicioFase = new Date(fase.inicioPrevisto!).getTime();
          const prazoFase = new Date(fase.prazo!).getTime();
          const esquerda = ((inicioFase - inicioGlobal) / duracaoGlobal) * 100;
          const largura = ((prazoFase - inicioFase) / duracaoGlobal) * 100;
          const feitos = fase.itens.filter((i) => i.concluido).length;
          const total = fase.itens.length;
          const preenchido = total > 0 ? (feitos / total) * 100 : 0;
          const cor = fase.trilho === "legal" ? "var(--vermelho)" : "var(--azul)";

          return (
            <div className="gantt__linha" key={fase.id}>
              <span className="gantt__rotulo" title={fase.nome}>
                {fase.nome}
              </span>
              <div className="gantt__trilha">
                <div
                  className="gantt__barra"
                  style={{
                    left: `${esquerda}%`,
                    width: `${Math.max(largura, 2)}%`,
                    background: `color-mix(in srgb, ${cor} 22%, transparent)`,
                  }}
                >
                  <div className="gantt__preenchido" style={{ width: `${preenchido}%`, background: cor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {semDatas.length > 0 && (
        <p className="gantt__aviso">
          Sem início/prazo registrado, fora da linha do tempo: {semDatas.map((f) => f.nome).join(", ")}.
        </p>
      )}
    </section>
  );
}
