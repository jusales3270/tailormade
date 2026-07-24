import { describe, expect, it } from "vitest";
import { r01FaseConcluida, r02FaseBloqueada, r03DeliberacaoAprovada, r04DeliberacaoExpirada } from "./status";
import type { DeliberacaoEstado, DocumentoEstado, FaseEstado } from "./tipos";

describe("R01 — fase concluída", () => {
  it("é verdadeira quando todos os itens estão concluídos", () => {
    const fase: FaseEstado = {
      id: "f1",
      nome: "F1",
      itens: [
        { id: "i1", concluido: true, dependeDocumentoId: null },
        { id: "i2", concluido: true, dependeDocumentoId: null },
      ],
    };
    expect(r01FaseConcluida(fase)).toBe(true);
  });

  it("é falsa quando falta pelo menos um item", () => {
    const fase: FaseEstado = {
      id: "f2",
      nome: "F2",
      itens: [
        { id: "i1", concluido: true, dependeDocumentoId: null },
        { id: "i2", concluido: false, dependeDocumentoId: null },
      ],
    };
    expect(r01FaseConcluida(fase)).toBe(false);
  });

  it("é falsa para uma fase sem itens (não há o que estar concluído)", () => {
    expect(r01FaseConcluida({ id: "f0", nome: "vazia", itens: [] })).toBe(false);
  });
});

describe("R02 — fase bloqueada", () => {
  const docAusente: DocumentoEstado = {
    id: "doc1",
    codigo: "DOC-06",
    nome: "Termo de cessão",
    grupo: "PI",
    critico: true,
    status: "ausente",
    venceEm: null,
  };
  const docAssinado: DocumentoEstado = { ...docAusente, id: "doc2", status: "assinado" };
  const documentosPorId = new Map([
    [docAusente.id, docAusente],
    [docAssinado.id, docAssinado],
  ]);

  it("é verdadeira quando um item depende de documento ausente", () => {
    const fase: FaseEstado = {
      id: "f5",
      nome: "F5",
      itens: [{ id: "i1", concluido: false, dependeDocumentoId: docAusente.id }],
    };
    expect(r02FaseBloqueada(fase, documentosPorId)).toBe(true);
  });

  it("é falsa quando o documento do qual depende já existe assinado", () => {
    const fase: FaseEstado = {
      id: "f5b",
      nome: "F5b",
      itens: [{ id: "i1", concluido: false, dependeDocumentoId: docAssinado.id }],
    };
    expect(r02FaseBloqueada(fase, documentosPorId)).toBe(false);
  });

  it("é falsa quando nenhum item depende de documento", () => {
    const fase: FaseEstado = { id: "f6", nome: "F6", itens: [{ id: "i1", concluido: false, dependeDocumentoId: null }] };
    expect(r02FaseBloqueada(fase, documentosPorId)).toBe(false);
  });
});

describe("R03 — deliberação aprovada", () => {
  it("é verdadeira quando a soma dos votos sim atinge o quórum", () => {
    const delib: DeliberacaoEstado = {
      id: "d1",
      codigo: "D-001",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: null,
      votos: [
        { membroId: "a", voto: "sim", pesoPct: 30 },
        { membroId: "b", voto: "sim", pesoPct: 50 },
        { membroId: "c", voto: "nao", pesoPct: 20 },
      ],
    };
    expect(r03DeliberacaoAprovada(delib)).toBe(true);
  });

  it("é falsa quando a soma dos votos sim fica abaixo do quórum", () => {
    const delib: DeliberacaoEstado = {
      id: "d2",
      codigo: "D-004",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: null,
      votos: [
        { membroId: "a", voto: "sim", pesoPct: 25 },
        { membroId: "b", voto: "nao", pesoPct: 20 },
      ],
    };
    expect(r03DeliberacaoAprovada(delib)).toBe(false);
  });
});

describe("R04 — deliberação expirada", () => {
  const agora = new Date("2026-07-24T00:00:00Z");

  it("é verdadeira quando o prazo passou e R03 é falsa", () => {
    const delib: DeliberacaoEstado = {
      id: "d3",
      codigo: "D-999",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: "2026-07-01T00:00:00Z",
      votos: [{ membroId: "a", voto: "sim", pesoPct: 30 }],
    };
    expect(r04DeliberacaoExpirada(delib, agora)).toBe(true);
  });

  it("é falsa quando o prazo passou mas a deliberação foi aprovada", () => {
    const delib: DeliberacaoEstado = {
      id: "d4",
      codigo: "D-002",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: "2026-07-01T00:00:00Z",
      votos: [{ membroId: "a", voto: "sim", pesoPct: 100 }],
    };
    expect(r04DeliberacaoExpirada(delib, agora)).toBe(false);
  });

  it("é falsa quando o prazo ainda não chegou", () => {
    const delib: DeliberacaoEstado = {
      id: "d5",
      codigo: "D-004",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: "2026-07-25T00:00:00Z",
      votos: [{ membroId: "a", voto: "sim", pesoPct: 50 }],
    };
    expect(r04DeliberacaoExpirada(delib, agora)).toBe(false);
  });

  it("é falsa quando não há prazo definido", () => {
    const delib: DeliberacaoEstado = {
      id: "d6",
      codigo: "D-000",
      titulo: "teste",
      quorumPct: 75,
      encerraEm: null,
      votos: [],
    };
    expect(r04DeliberacaoExpirada(delib, agora)).toBe(false);
  });
});
