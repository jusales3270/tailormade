import { describe, expect, it } from "vitest";
import type { Leitura } from "@/lib/regras/tipos";
import { montarPrompt, validarNarracao } from "./prompt";

// Leituras falsas (master doc §5: "injeta uma leitura falsa e verifica que nenhum número
// inventado aparece na saída") — não vêm de fixture real, só para exercitar o validador.
const LEITURAS: Leitura[] = [
  {
    regra: "R07",
    severidade: "atencao",
    titulo: "Aporte comprometido em aberto: Felipe Nakamura",
    fatos: { faltaCents: 500000 },
    origem: { tabela: "aportes", id: "aporte-fake" },
  },
  {
    regra: "R09",
    severidade: "info",
    titulo: "Fôlego de caixa",
    fatos: { caixaCents: 9695000, queimaMediaCents: 101667, folegoMeses: 95.4 },
    origem: { tabela: "movimentos", id: "resumo" },
  },
];

describe("validarNarracao", () => {
  it("aceita texto que só cita números presentes nos fatos", () => {
    const texto =
      "Há 2 leituras: falta R$ 5.000,00 do aporte de Felipe, e o caixa de R$ 96.950,00 dá 95,4 meses de fôlego.";
    expect(validarNarracao(texto, LEITURAS)).toBe(true);
  });

  it("aceita a contagem agregada (total/severidade) mesmo sem estar em fatos", () => {
    const texto = "Há 2 leituras no momento: 1 de atenção e 1 informativa.";
    expect(validarNarracao(texto, LEITURAS)).toBe(true);
  });

  it("rejeita um número inventado que não aparece em nenhuma leitura", () => {
    const texto = "O caixa está confortável, com R$ 9.999.999,00 de saldo disponível.";
    expect(validarNarracao(texto, LEITURAS)).toBe(false);
  });

  it("rejeita quando o modelo inventa um valor plausível mas trocado (leitura falsa injetada)", () => {
    // R07 acusa falta de R$ 5.000,00 (faltaCents: 500000) — qualquer outro valor "redondo"
    // e plausível citado no lugar é uma alucinação, mesmo não sendo um número absurdo.
    const textoAlucinado = "Felipe ainda tem R$ 7.500,00 pendentes do aporte comprometido.";
    expect(validarNarracao(textoAlucinado, LEITURAS)).toBe(false);
  });

  it("aceita array vazio (nada a validar) — quem decide o que fazer é narrar(), não isto", () => {
    expect(validarNarracao("qualquer coisa sem número", [])).toBe(true);
  });
});

describe("montarPrompt", () => {
  it("nunca embute uma conclusão fora dos fatos — só serializa o que a leitura já carrega", () => {
    const { user, contagem } = montarPrompt(LEITURAS);
    expect(user).toContain("500000");
    expect(user).toContain("R07");
    expect(contagem).toEqual({ total: 2, risco: 0, acao: 0, atencao: 1, info: 1 });
  });

  it("o prompt de sistema proíbe explicitamente inventar números", () => {
    const { system } = montarPrompt(LEITURAS);
    expect(system.toLowerCase()).toContain("nunca invente");
  });
});
