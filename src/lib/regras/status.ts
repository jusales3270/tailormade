// R01-R04 usam "⟺" no master doc (§5): são fatos derivados que outras partes do painel
// consultam (anéis de progresso, "fase atual", status de deliberação) — não viram
// Leitura por conta própria. R05 em diante usam "⟹" e produzem Leitura (ver regras.ts).

import type { DeliberacaoEstado, DocumentoEstado, FaseEstado } from "./tipos";

// R01 — Fase concluída ⟺ todos os fase_itens concluídos.
export function r01FaseConcluida(fase: FaseEstado): boolean {
  return fase.itens.length > 0 && fase.itens.every((item) => item.concluido);
}

// R02 — Fase bloqueada ⟺ existe item com depende_documento_id em status ausente ou rascunho.
// Só o `status` do documento importa aqui — Pick evita ter que montar um DocumentoEstado
// inteiro só pra chamar esta função a partir de uma query que não trouxe o resto.
export function r02FaseBloqueada(
  fase: FaseEstado,
  documentosPorId: Map<string, Pick<DocumentoEstado, "status">>,
): boolean {
  return fase.itens.some((item) => {
    if (!item.dependeDocumentoId) return false;
    const doc = documentosPorId.get(item.dependeDocumentoId);
    return doc !== undefined && (doc.status === "ausente" || doc.status === "rascunho");
  });
}

// R03 — Deliberação aprovada ⟺ Σ peso_pct dos votos sim ≥ quorum_pct.
export function r03DeliberacaoAprovada(deliberacao: DeliberacaoEstado): boolean {
  const somaSim = deliberacao.votos
    .filter((v) => v.voto === "sim")
    .reduce((acc, v) => acc + v.pesoPct, 0);
  return somaSim >= deliberacao.quorumPct;
}

// R04 — Deliberação expirada ⟺ encerra_em < now() e R03 falsa.
export function r04DeliberacaoExpirada(deliberacao: DeliberacaoEstado, agora: Date): boolean {
  if (!deliberacao.encerraEm) return false;
  return new Date(deliberacao.encerraEm) < agora && !r03DeliberacaoAprovada(deliberacao);
}
