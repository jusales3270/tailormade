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
  responsavelNome: string | null;
  inicioPrevisto: string | null;
  prazo: string | null;
  concluida: boolean;
  bloqueada: boolean;
  itens: FaseItemUI[];
};
