import { describe, expect, it } from "vitest";
import { gerarCsvAuditoria, type LinhaAuditoria } from "./auditoria-csv";

describe("gerarCsvAuditoria", () => {
  it("gera cabeçalho e uma linha por registro", () => {
    const linhas: LinhaAuditoria[] = [
      {
        criadoEm: "2026-07-25T20:00:00Z",
        atorNome: "Ricardo Alencar",
        acao: "movimento.aprovar",
        entidade: "movimentos",
        entidadeId: "abc-123",
        antes: { status: "aguarda_aprovacao" },
        depois: { status: "aprovado" },
      },
    ];
    const csv = gerarCsvAuditoria(linhas);
    const [cabecalho, linha1] = csv.split("\r\n");
    expect(cabecalho).toBe("criado_em,ator,acao,entidade,entidade_id,antes,depois");
    expect(linha1).toContain("Ricardo Alencar");
    expect(linha1).toContain("movimento.aprovar");
  });

  it("usa 'sistema' quando não há ator (ação do cron)", () => {
    const csv = gerarCsvAuditoria([
      {
        criadoEm: "2026-07-25T20:00:00Z",
        atorNome: null,
        acao: "deliberacao.encerrar",
        entidade: "deliberacoes",
        entidadeId: "d-1",
        antes: null,
        depois: { status: "expirada" },
      },
    ]);
    expect(csv.split("\r\n")[1]).toContain("sistema");
  });

  it("escapa campos com vírgula ou aspas sem quebrar as colunas", () => {
    const csv = gerarCsvAuditoria([
      {
        criadoEm: "2026-07-25T20:00:00Z",
        atorNome: 'Ana "Bia" Rocha, sócia',
        acao: "mensagem.publicar",
        entidade: "mensagens",
        entidadeId: null,
        antes: null,
        depois: null,
      },
    ]);
    const linha = csv.split("\r\n")[1];
    expect(linha).toContain('"Ana ""Bia"" Rocha, sócia"');
    // entidade_id vazio não deve deslocar as colunas seguintes.
    expect(linha.split(",").length >= 7).toBe(true);
  });
});
