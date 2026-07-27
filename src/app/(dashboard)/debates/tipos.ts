export type CanalUI = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  criadoPor: string | null;
};

export type MembroAvatarUI = {
  id: string;
  nome: string;
  avatarUrl: string | null;
};

export type MensagemUI = {
  id: string;
  corpo: string;
  criadoEm: string;
  editadoEm: string | null;
  autorId: string;
  autorNome: string;
};
