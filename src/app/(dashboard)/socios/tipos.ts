export type PapelMembro = "admin" | "socio" | "tecnico" | "convidado";

export type MembroUI = {
  id: string;
  nome: string;
  email: string;
  papel: PapelMembro;
  participacaoPct: number;
  ativo: boolean;
  avatarUrl: string | null;
};

export type DeliberacaoAprovadaUI = {
  id: string;
  codigo: string;
  titulo: string;
};
