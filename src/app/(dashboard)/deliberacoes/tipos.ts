export type VotoUI = {
  membroId: string;
  membroNome: string;
  voto: "sim" | "nao" | "abstencao" | null;
};

export type DeliberacaoUI = {
  id: string;
  codigo: string;
  titulo: string;
  quorumPct: number;
  status: string;
  encerraEm: string | null;
  simPct: number;
  naoPct: number;
  votos: VotoUI[];
  meuVoto: "sim" | "nao" | "abstencao" | null;
};
