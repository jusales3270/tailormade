import { describe, expect, it } from "vitest";
import {
  calcularLeituras,
  r05DocumentosCriticosAusentes,
  r06ReunioesSemPauta,
  r07AportesPendentes,
  r08MovimentosAguardandoAprovacao,
  r09FolegoDeCaixa,
  r10DocumentosVencendo,
  r11SugestoesPendentes,
} from "./regras";
import { agoraFixture, estadoFundacao } from "./fixtures/fundacao";
import type { EstadoOrg } from "./tipos";

const ESTADO_VAZIO: EstadoOrg = {
  agora: agoraFixture,
  fases: [],
  documentos: [],
  deliberacoes: [],
  reunioes: [],
  aportes: [],
  movimentos: [],
  sugestoes: [],
  caixaCents: 0,
  queimaMediaCents: 0,
};

describe("calcularLeituras — fixture da fundação (T-007, critério de aceite)", () => {
  const leituras = calcularLeituras(estadoFundacao);

  it("produz exatamente 7 leituras, uma por regra que dispara", () => {
    expect(leituras).toHaveLength(7);
    expect(leituras.map((l) => l.regra)).toEqual(["R05", "R08", "R06", "R07", "R10", "R11", "R09"]);
  });

  it("R05: aponta o DOC-06 como risco, com origem rastreável", () => {
    const [r05] = leituras;
    expect(r05.severidade).toBe("risco");
    expect(r05.origem).toEqual({ tabela: "documentos", id: "doc:DOC-06" });
    expect(r05.fatos.codigo).toBe("DOC-06");
  });

  it("R08: soma exatamente os dois movimentos aguardando aprovação (R$ 4.280)", () => {
    const r08 = leituras.find((l) => l.regra === "R08")!;
    expect(r08.severidade).toBe("acao");
    expect(r08.fatos).toEqual({ quantidade: 2, somaCents: 428_000 });
  });

  it("R06: aponta a R-013 (dentro de 48h, sem pauta) e não a R-012 (tem pauta)", () => {
    const r06 = leituras.filter((l) => l.regra === "R06");
    expect(r06).toHaveLength(1);
    expect(r06[0].origem).toEqual({ tabela: "reunioes", id: "reuniao:R-013" });
  });

  it("R07: aponta só o Felipe, com a falta exata de R$ 5.000", () => {
    const r07 = leituras.filter((l) => l.regra === "R07");
    expect(r07).toHaveLength(1);
    expect(r07[0].origem).toEqual({ tabela: "aportes", id: "aporte:fel" });
    expect(r07[0].fatos.faltaCents).toBe(500_000);
  });

  it("R10: aponta o DOC-10 sintético, não os outros 9 documentos sem vencimento", () => {
    const r10 = leituras.filter((l) => l.regra === "R10");
    expect(r10).toHaveLength(1);
    expect(r10[0].origem).toEqual({ tabela: "documentos", id: "doc:DOC-10" });
  });

  it("R11: aponta a sugestão sintética parada há mais de 7 dias", () => {
    const r11 = leituras.filter((l) => l.regra === "R11");
    expect(r11).toHaveLength(1);
    expect(r11[0].origem).toEqual({ tabela: "sugestoes", id: "sugestao:1" });
  });

  it("R09: calcula o fôlego a partir de caixa e queima, sempre presente", () => {
    const r09 = leituras.find((l) => l.regra === "R09")!;
    expect(r09.severidade).toBe("info");
    expect(r09.fatos.folegoMeses).toBe(7.5);
  });

  it("D-001 (aprovada) e D-004 (aberta, sem quórum) não geram nenhuma leitura — R03/R04 são status, não alerta", () => {
    const regrasComDelib = leituras.filter((l) => l.origem.tabela === "deliberacoes");
    expect(regrasComDelib).toHaveLength(0);
  });
});

describe("anti-alucinação: sem registro, o motor não afirma nada", () => {
  it("estado vazio produz só a leitura de R09 (a única incondicional)", () => {
    const leituras = calcularLeituras(ESTADO_VAZIO);
    expect(leituras).toHaveLength(1);
    expect(leituras[0].regra).toBe("R09");
  });

  it("cada regra isolada devolve array vazio quando não há o que apontar", () => {
    expect(r05DocumentosCriticosAusentes([])).toEqual([]);
    expect(r06ReunioesSemPauta([], agoraFixture)).toEqual([]);
    expect(r07AportesPendentes([])).toEqual([]);
    expect(r08MovimentosAguardandoAprovacao([])).toEqual([]);
    expect(r10DocumentosVencendo([], agoraFixture)).toEqual([]);
    expect(r11SugestoesPendentes([], agoraFixture)).toEqual([]);
  });

  it("toda leitura carrega origem { tabela, id } — nunca um alerta solto", () => {
    for (const leitura of calcularLeituras(estadoFundacao)) {
      expect(leitura.origem.tabela).toBeTruthy();
      expect(leitura.origem.id).toBeTruthy();
    }
  });
});

describe("R09 isolada", () => {
  it("fôlego infinito quando não há queima", () => {
    const leitura = r09FolegoDeCaixa(1000, 0);
    expect(leitura.fatos.folegoMeses).toBe(Number.POSITIVE_INFINITY);
  });
});
