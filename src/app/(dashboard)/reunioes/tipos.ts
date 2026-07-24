export type PautaItemUI = { id: string; item: string };

export type EncaminhamentoUI = {
  id: string;
  titulo: string;
  responsavelNome: string;
  prazo: string;
  status: string;
};

export type AtaUI = { corpo: string; publicadaEm: string | null };

export type ReuniaoUI = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  inicio: string;
  pauta: PautaItemUI[];
  ata: AtaUI | null;
  encaminhamentos: EncaminhamentoUI[];
  semPauta: boolean;
};

export type MembroOpcaoUI = { id: string; nome: string };
