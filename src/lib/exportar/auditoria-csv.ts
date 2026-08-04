// Módulo puro (sem I/O) — quem busca as linhas no banco é a route handler que chama isto.
export type LinhaAuditoria = {
  criadoEm: string;
  atorNome: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  antes: unknown;
  depois: unknown;
};

const CABECALHO = ["criado_em", "ator", "acao", "entidade", "entidade_id", "antes", "depois"];

function escaparCampo(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function serializarJson(valor: unknown): string {
  return valor === null || valor === undefined ? "" : JSON.stringify(valor);
}

export function gerarCsvAuditoria(linhas: LinhaAuditoria[]): string {
  const corpo = linhas.map((l) =>
    [
      l.criadoEm,
      l.atorNome ?? "sistema",
      l.acao,
      l.entidade,
      l.entidadeId ?? "",
      serializarJson(l.antes),
      serializarJson(l.depois),
    ]
      .map(escaparCampo)
      .join(","),
  );
  return [CABECALHO.join(","), ...corpo].join("\r\n");
}
