export type StatusMovimento = "previsto" | "aguarda_aprovacao" | "aprovado" | "pago" | "rejeitado";

export type MovimentoUI = {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  valorCents: number;
  direcao: "entrada" | "saida";
  status: StatusMovimento;
  solicitanteId: string | null;
  solicitanteNome: string | null;
};

export type AporteUI = {
  id: string;
  membroNome: string;
  comprometidoCents: number;
  integralizadoCents: number;
};

export type DocumentoOpcaoUI = { id: string; codigo: string; nome: string };

// Alimenta o select de aportante no formulário de novo aporte.
export type MembroOpcaoUI = { id: string; nome: string };

export type MetricasUI = {
  caixaCents: number;
  queimaMediaCents: number;
  folegoMeses: number;
  comprometidoCents: number;
  integralizadoCents: number;
};
