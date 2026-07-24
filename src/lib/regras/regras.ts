// R05-R11 usam "⟹" no master doc (§5): condição implica alerta. São a única fonte dos
// itens que o Copiloto narra — se o array vier vazio daqui, o Copiloto diz que não há
// leituras, não preenche o silêncio.

import type {
  AporteEstado,
  DocumentoEstado,
  EstadoOrg,
  Leitura,
  MovimentoEstado,
  ReuniaoEstado,
  SugestaoEstado,
} from "./tipos";

const DIA_MS = 24 * 60 * 60 * 1000;

// R05 — Documento critico=true em ausente ⟹ risco.
export function r05DocumentosCriticosAusentes(documentos: DocumentoEstado[]): Leitura[] {
  return documentos
    .filter((d) => d.critico && d.status === "ausente")
    .map((d) => ({
      regra: "R05",
      severidade: "risco",
      titulo: `Documento crítico ausente: ${d.nome}`,
      fatos: { codigo: d.codigo, grupo: d.grupo },
      origem: { tabela: "documentos", id: d.id },
    }));
}

// R06 — Reunião futura a menos de 48h sem item de pauta ⟹ atenção.
export function r06ReunioesSemPauta(reunioes: ReuniaoEstado[], agora: Date): Leitura[] {
  const limite = new Date(agora.getTime() + 2 * DIA_MS);
  return reunioes
    .filter((r) => {
      const inicio = new Date(r.inicio);
      return inicio > agora && inicio <= limite && r.pauta.length === 0;
    })
    .map((r) => ({
      regra: "R06",
      severidade: "atencao",
      titulo: `Reunião sem pauta: ${r.titulo}`,
      fatos: { codigo: r.codigo, inicio: r.inicio },
      origem: { tabela: "reunioes", id: r.id },
    }));
}

// R07 — aportes.comprometido ≠ Σ aporte_eventos > 0 ⟹ atenção com o valor exato.
export function r07AportesPendentes(aportes: AporteEstado[]): Leitura[] {
  return aportes
    .filter((a) => a.integralizadoCents < a.comprometidoCents)
    .map((a) => ({
      regra: "R07",
      severidade: "atencao",
      titulo: `Aporte comprometido em aberto: ${a.membroNome}`,
      fatos: { faltaCents: a.comprometidoCents - a.integralizadoCents },
      origem: { tabela: "aportes", id: a.id },
    }));
}

// R08 — Movimentos em aguarda_aprovacao ⟹ ação, com soma.
export function r08MovimentosAguardandoAprovacao(movimentos: MovimentoEstado[]): Leitura[] {
  const pendentes = movimentos.filter((m) => m.status === "aguarda_aprovacao");
  if (pendentes.length === 0) return [];

  const somaCents = pendentes.reduce((acc, m) => acc + m.valorCents, 0);
  return [
    {
      regra: "R08",
      severidade: "acao",
      titulo: `${pendentes.length} movimento(s) aguardando aprovação`,
      fatos: { quantidade: pendentes.length, somaCents },
      // Agregado sobre várias linhas — sem uma única linha de origem, como R09.
      origem: { tabela: "movimentos", id: "aguarda_aprovacao" },
    },
  ];
}

// R09 — Fôlego = caixa ÷ média de saídas dos últimos 90 dias. Sempre presente.
export function r09FolegoDeCaixa(caixaCents: number, queimaMediaCents: number): Leitura {
  const folegoMeses = queimaMediaCents > 0 ? caixaCents / queimaMediaCents : Number.POSITIVE_INFINITY;
  return {
    regra: "R09",
    severidade: "info",
    titulo: "Fôlego de caixa",
    fatos: {
      caixaCents,
      queimaMediaCents,
      folegoMeses: Math.round(folegoMeses * 10) / 10,
    },
    origem: { tabela: "movimentos", id: "resumo" },
  };
}

// R10 — Documento com vence_em a menos de 30 dias ⟹ atenção.
export function r10DocumentosVencendo(documentos: DocumentoEstado[], agora: Date): Leitura[] {
  const limite = new Date(agora.getTime() + 30 * DIA_MS);
  return documentos
    .filter((d) => {
      if (!d.venceEm) return false;
      const vencimento = new Date(d.venceEm);
      return vencimento > agora && vencimento <= limite;
    })
    .map((d) => ({
      regra: "R10",
      severidade: "atencao",
      titulo: `Documento vence em breve: ${d.nome}`,
      fatos: { venceEm: d.venceEm! },
      origem: { tabela: "documentos", id: d.id },
    }));
}

// R11 — Sugestão em pendente há mais de 7 dias ⟹ atenção.
export function r11SugestoesPendentes(sugestoes: SugestaoEstado[], agora: Date): Leitura[] {
  const seteDias = 7 * DIA_MS;
  return sugestoes
    .filter((s) => s.status === "pendente" && agora.getTime() - new Date(s.criadoEm).getTime() > seteDias)
    .map((s) => ({
      regra: "R11",
      severidade: "atencao",
      titulo: "Sugestão pendente há mais de 7 dias",
      fatos: { sugestaoId: s.id },
      origem: { tabela: "sugestoes", id: s.id },
    }));
}

// Única fonte dos alertas do Copiloto. Ordem: risco > ação > atenção > info.
export function calcularLeituras(estado: EstadoOrg): Leitura[] {
  return [
    ...r05DocumentosCriticosAusentes(estado.documentos),
    ...r08MovimentosAguardandoAprovacao(estado.movimentos),
    ...r06ReunioesSemPauta(estado.reunioes, estado.agora),
    ...r07AportesPendentes(estado.aportes),
    ...r10DocumentosVencendo(estado.documentos, estado.agora),
    ...r11SugestoesPendentes(estado.sugestoes, estado.agora),
    r09FolegoDeCaixa(estado.caixaCents, estado.queimaMediaCents),
  ];
}
