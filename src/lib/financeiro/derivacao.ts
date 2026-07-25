// Deriva caixa/queima a partir do razão real (aporte_eventos + movimentos pagos) — a
// conta que o motor de regras (R09) deliberadamente não faz sozinho, por decisão do
// T-015 (ver comentário em lib/regras/tipos.ts). Extraído para cá porque o layout do
// Copiloto (T-017) precisa do mesmo cálculo que a página Financeiro (T-015).
const DIA_MS = 24 * 60 * 60 * 1000;

export type MovimentoParaCaixa = {
  valorCents: number;
  direcao: "entrada" | "saida";
  status: string;
  competencia: string | null;
};

export function calcularCaixaEQueima(
  movimentos: MovimentoParaCaixa[],
  integralizadoCents: number,
  agora: Date,
): { caixaCents: number; queimaMediaCents: number } {
  const pagos = movimentos.filter((m) => m.status === "pago");
  const entradasPagasCents = pagos
    .filter((m) => m.direcao === "entrada")
    .reduce((acc, m) => acc + m.valorCents, 0);
  const saidasPagasCents = pagos
    .filter((m) => m.direcao === "saida")
    .reduce((acc, m) => acc + m.valorCents, 0);
  const caixaCents = integralizadoCents + entradasPagasCents - saidasPagasCents;

  const limite90d = new Date(agora.getTime() - 90 * DIA_MS);
  const saidasUltimos90dCents = pagos
    .filter((m) => m.direcao === "saida" && m.competencia && new Date(m.competencia) >= limite90d)
    .reduce((acc, m) => acc + m.valorCents, 0);
  const queimaMediaCents = Math.round(saidasUltimos90dCents / 3);

  return { caixaCents, queimaMediaCents };
}
