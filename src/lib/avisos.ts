import { brl } from "@/lib/formatar";

export type TipoAviso = "reuniao" | "movimento" | "deliberacao";

export type Aviso = {
  // "<tipo>:<uuid>" — é o que vai para avisos_lidos.aviso_chave. Deriva do registro de
  // origem, então nunca fica órfão nem precisa ser criado junto com ele.
  chave: string;
  tipo: TipoAviso;
  titulo: string;
  detalhe: string;
  quando: string | null;
  rota: string;
  lido: boolean;
};

export type EntradasAvisos = {
  reunioes: { id: string; codigo: string; titulo: string; inicio: string }[];
  movimentos: {
    id: string;
    codigo: string;
    descricao: string;
    valorCents: number;
    direcao: "entrada" | "saida";
    competencia: string | null;
  }[];
  deliberacoes: { id: string; codigo: string; titulo: string; abreEm: string | null }[];
  chavesLidas: Set<string>;
};

const ROTA_POR_TIPO: Record<TipoAviso, string> = {
  reuniao: "/reunioes",
  movimento: "/financeiro",
  deliberacao: "/deliberacoes",
};

// Avisos são o retrato do que aconteceu, não uma análise: cada linha corresponde a um
// registro real (uma reunião marcada, uma despesa lançada, uma deliberação aberta) e é
// descrita nos termos dele. Substituiu o copiloto, que interpretava esses mesmos fatos
// via modelo de linguagem e custava 1,4–2,4s em toda navegação.
export function montarAvisos(e: EntradasAvisos): Aviso[] {
  const avisos: Aviso[] = [];

  for (const r of e.reunioes) {
    const chave = `reuniao:${r.id}`;
    avisos.push({
      chave,
      tipo: "reuniao",
      titulo: `Reunião marcada: ${r.titulo}`,
      detalhe: r.codigo,
      quando: r.inicio,
      rota: ROTA_POR_TIPO.reuniao,
      lido: e.chavesLidas.has(chave),
    });
  }

  for (const m of e.movimentos) {
    const chave = `movimento:${m.id}`;
    const sinal = m.direcao === "saida" ? "−" : "+";
    avisos.push({
      chave,
      tipo: "movimento",
      titulo: `${m.direcao === "saida" ? "Despesa" : "Receita"} lançada: ${m.descricao}`,
      detalhe: `${m.codigo} · ${sinal}${brl(m.valorCents)}`,
      quando: m.competencia,
      rota: ROTA_POR_TIPO.movimento,
      lido: e.chavesLidas.has(chave),
    });
  }

  for (const d of e.deliberacoes) {
    const chave = `deliberacao:${d.id}`;
    avisos.push({
      chave,
      tipo: "deliberacao",
      titulo: `Deliberação: ${d.titulo}`,
      detalhe: d.codigo,
      quando: d.abreEm,
      rota: ROTA_POR_TIPO.deliberacao,
      lido: e.chavesLidas.has(chave),
    });
  }

  // Mais recente primeiro; sem data vai para o fim em vez de sumir.
  return avisos.sort((a, b) => {
    if (!a.quando && !b.quando) return 0;
    if (!a.quando) return 1;
    if (!b.quando) return -1;
    return new Date(b.quando).getTime() - new Date(a.quando).getTime();
  });
}
