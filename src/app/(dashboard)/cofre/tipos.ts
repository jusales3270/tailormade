export type StatusDocumento =
  | "ausente"
  | "rascunho"
  | "revisao"
  | "aguarda_assinatura"
  | "assinado"
  | "vencido";

export type DocumentoUI = {
  id: string;
  codigo: string;
  nome: string;
  grupo: string;
  status: StatusDocumento;
  critico: boolean;
  responsavelNome: string | null;
  ultimaVersao: number | null;
  ultimoHash: string | null;
  enviadoEm: string | null;
};
