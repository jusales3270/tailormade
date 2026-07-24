// Motor de regras determinístico (master doc §5). Módulo puro, sem I/O: recebe um
// EstadoOrg já carregado e devolve Leitura[]. Quem busca o estado no banco é quem chama
// este módulo (Server Component, cron etc.) — aqui dentro não existe supabase.

export type Severidade = "risco" | "acao" | "atencao" | "info";

export type Leitura = {
  regra: string; // "R01".."R11"
  severidade: Severidade;
  titulo: string;
  fatos: Record<string, string | number>;
  origem: { tabela: string; id: string };
};

export type FaseItemEstado = {
  id: string;
  concluido: boolean;
  dependeDocumentoId: string | null;
};

export type FaseEstado = {
  id: string;
  nome: string;
  itens: FaseItemEstado[];
};

export type StatusDocumento =
  | "ausente"
  | "rascunho"
  | "revisao"
  | "aguarda_assinatura"
  | "assinado"
  | "vencido";

export type DocumentoEstado = {
  id: string;
  codigo: string;
  nome: string;
  grupo: string;
  critico: boolean;
  status: StatusDocumento;
  venceEm: string | null; // ISO date
};

export type VotoEstado = { membroId: string; voto: "sim" | "nao" | "abstencao"; pesoPct: number };

export type DeliberacaoEstado = {
  id: string;
  codigo: string;
  titulo: string;
  quorumPct: number;
  encerraEm: string | null; // ISO datetime
  votos: VotoEstado[];
};

export type ReuniaoEstado = {
  id: string;
  codigo: string;
  titulo: string;
  inicio: string; // ISO datetime
  pauta: string[];
};

export type AporteEstado = {
  id: string;
  membroNome: string;
  comprometidoCents: number;
  integralizadoCents: number;
};

export type StatusMovimento = "previsto" | "aguarda_aprovacao" | "aprovado" | "pago" | "rejeitado";

export type MovimentoEstado = {
  id: string;
  codigo: string;
  descricao: string;
  valorCents: number;
  status: StatusMovimento;
};

export type SugestaoEstado = {
  id: string;
  status: "pendente" | "promovida" | "descartada";
  criadoEm: string; // ISO datetime
};

export type EstadoOrg = {
  agora: Date;
  fases: FaseEstado[];
  documentos: DocumentoEstado[];
  deliberacoes: DeliberacaoEstado[];
  reunioes: ReuniaoEstado[];
  aportes: AporteEstado[];
  movimentos: MovimentoEstado[];
  sugestoes: SugestaoEstado[];
  // R09 recebe caixa/queima prontos em vez de derivar de movimentos: como calcular o
  // saldo de caixa é decisão do T-015 (Financeiro), não deste motor.
  caixaCents: number;
  queimaMediaCents: number;
};
