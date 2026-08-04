export type FaseItemUI = {
  id: string;
  titulo: string;
  concluido: boolean;
};

export type FaseUI = {
  id: string;
  ordem: number;
  nome: string;
  trilho: "legal" | "op";
  responsavelId: string | null;
  responsavelNome: string | null;
  inicioPrevisto: string | null;
  prazo: string | null;
  concluida: boolean;
  bloqueada: boolean;
  itens: FaseItemUI[];
};

// Alimenta o select de responsável nos formulários de fase.
export type MembroOpcaoUI = {
  id: string;
  nome: string;
};
