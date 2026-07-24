// Fixture adaptada de supabase/seed.sql (master doc §5: "os dados do mockup viram
// fixtures/fundacao.json e são o critério de aceite do T-007"). Em .ts em vez de .json
// para ganhar checagem de tipo em tempo de compilação — o motor é "sem I/O" de
// qualquer forma, então não há perda de fidelidade ao trocar o formato do arquivo.
//
// `agora` é o relógio de referência deste fixture, não o "hoje" implícito do seed
// (2026-07-23) — usei 2026-07-24 para a janela de 48h do R06 capturar a R-013 sem
// ambiguidade de fuso/hora. DOC-10 e a sugestão são sintéticos, adicionados só para
// exercitar R10 e R11 (o seed real não tem nenhum vencimento nem sugestão).

import type { EstadoOrg } from "../tipos";

export const agoraFixture = new Date("2026-07-24T00:00:00Z");

export const estadoFundacao: EstadoOrg = {
  agora: agoraFixture,

  fases: [
    {
      id: "fase:F1",
      nome: "Concepção e alinhamento",
      itens: [
        { id: "item:F1-1", concluido: true, dependeDocumentoId: null },
        { id: "item:F1-2", concluido: true, dependeDocumentoId: null },
        { id: "item:F1-3", concluido: true, dependeDocumentoId: null },
      ],
    },
    {
      id: "fase:F2",
      nome: "Estrutura societária",
      itens: [
        { id: "item:F2-1", concluido: true, dependeDocumentoId: null },
        { id: "item:F2-2", concluido: false, dependeDocumentoId: null },
        { id: "item:F2-3", concluido: false, dependeDocumentoId: null },
        { id: "item:F2-4", concluido: false, dependeDocumentoId: null },
      ],
    },
    {
      id: "fase:F5",
      nome: "Propriedade intelectual",
      itens: [
        { id: "item:F5-1", concluido: true, dependeDocumentoId: null },
        { id: "item:F5-2", concluido: false, dependeDocumentoId: null },
        { id: "item:F5-3", concluido: false, dependeDocumentoId: null },
        { id: "item:F5-4", concluido: false, dependeDocumentoId: "doc:DOC-06" },
      ],
    },
  ],

  documentos: [
    { id: "doc:DOC-01", codigo: "DOC-01", nome: "Ata de fundação", grupo: "Societário", critico: false, status: "assinado", venceEm: null },
    { id: "doc:DOC-02", codigo: "DOC-02", nome: "NDA mútuo entre fundadores", grupo: "Societário", critico: false, status: "assinado", venceEm: null },
    { id: "doc:DOC-03", codigo: "DOC-03", nome: "Contrato social", grupo: "Societário", critico: false, status: "revisao", venceEm: null },
    { id: "doc:DOC-04", codigo: "DOC-04", nome: "Acordo de sócios", grupo: "Societário", critico: false, status: "rascunho", venceEm: null },
    { id: "doc:DOC-05", codigo: "DOC-05", nome: "Procuração contábil", grupo: "Financeiro", critico: false, status: "aguarda_assinatura", venceEm: null },
    { id: "doc:DOC-06", codigo: "DOC-06", nome: "Termo de cessão de código", grupo: "Propriedade intelectual", critico: true, status: "ausente", venceEm: null },
    { id: "doc:DOC-07", codigo: "DOC-07", nome: "Comprovantes de aporte", grupo: "Financeiro", critico: false, status: "assinado", venceEm: null },
    { id: "doc:DOC-08", codigo: "DOC-08", nome: "Política de privacidade", grupo: "Conformidade", critico: false, status: "rascunho", venceEm: null },
    { id: "doc:DOC-09", codigo: "DOC-09", nome: "Busca de anterioridade INPI", grupo: "Propriedade intelectual", critico: false, status: "assinado", venceEm: null },
    // sintético — cobertura de R10, não existe no seed real
    { id: "doc:DOC-10", codigo: "DOC-10", nome: "Licença de uso de software", grupo: "Conformidade", critico: false, status: "assinado", venceEm: "2026-08-10" },
  ],

  deliberacoes: [
    {
      id: "delib:D-001",
      codigo: "D-001",
      titulo: "Divisão societária inicial de 30, 25, 25 e 20 por cento",
      quorumPct: 100,
      encerraEm: "2026-06-05T00:00:00Z",
      votos: [
        { membroId: "membro:ric", voto: "sim", pesoPct: 30 },
        { membroId: "membro:mar", voto: "sim", pesoPct: 25 },
        { membroId: "membro:fel", voto: "sim", pesoPct: 25 },
        { membroId: "membro:ana", voto: "sim", pesoPct: 20 },
      ],
    },
    {
      id: "delib:D-004",
      codigo: "D-004",
      titulo: "Vesting de 4 anos, cliff de 12 meses e aceleração de 50%",
      quorumPct: 75,
      encerraEm: "2026-07-25T00:00:00Z", // ainda no futuro em relação a `agora`
      votos: [
        { membroId: "membro:mar", voto: "sim", pesoPct: 25 },
        { membroId: "membro:ana", voto: "nao", pesoPct: 20 },
        { membroId: "membro:fel", voto: "sim", pesoPct: 25 },
        // ric não votou — soma dos "sim" fica em 50%, abaixo do quórum de 75%
      ],
    },
  ],

  reunioes: [
    {
      id: "reuniao:R-011",
      codigo: "R-011",
      titulo: "Comitê semanal de fundação",
      inicio: "2026-07-21T19:00:00Z", // já passou
      pauta: ["Escolha do contador", "Aportes"],
    },
    {
      id: "reuniao:R-012",
      codigo: "R-012",
      titulo: "Comitê semanal de fundação",
      inicio: "2026-07-28T19:00:00Z", // > 48h de `agora`
      pauta: ["Andamento na Junta Comercial", "Trava de escopo do produto", "Caixa e aportes"],
    },
    {
      id: "reuniao:R-013",
      codigo: "R-013",
      titulo: "Extraordinária — contrato social",
      inicio: "2026-07-25T19:00:00Z", // dentro de 48h de `agora`, sem pauta
      pauta: [],
    },
  ],

  aportes: [
    { id: "aporte:ric", membroNome: "Ricardo", comprometidoCents: 3_000_000, integralizadoCents: 3_000_000 },
    { id: "aporte:mar", membroNome: "Marina", comprometidoCents: 2_500_000, integralizadoCents: 2_500_000 },
    { id: "aporte:fel", membroNome: "Felipe", comprometidoCents: 2_500_000, integralizadoCents: 2_000_000 },
    { id: "aporte:ana", membroNome: "Ana", comprometidoCents: 2_000_000, integralizadoCents: 2_000_000 },
  ],

  movimentos: [
    { id: "mov:E-018", codigo: "E-018", descricao: "Honorários da revisão do contrato social", valorCents: 380_000, status: "aguarda_aprovacao" },
    { id: "mov:E-017", codigo: "E-017", descricao: "Taxa da Junta Comercial", valorCents: 48_000, status: "aguarda_aprovacao" },
    { id: "mov:E-016", codigo: "E-016", descricao: "Servidor e domínios, 12 meses", valorCents: 216_000, status: "pago" },
    { id: "mov:E-015", codigo: "E-015", descricao: "Contabilidade, mensalidade", valorCents: 89_000, status: "pago" },
    { id: "mov:E-014", codigo: "E-014", descricao: "Depósito de marca no INPI", valorCents: 142_000, status: "previsto" },
  ],

  sugestoes: [
    // sintético — cobertura de R11, não existe no seed real
    { id: "sugestao:1", status: "pendente", criadoEm: "2026-07-10T00:00:00Z" },
  ],

  caixaCents: 6_240_000,
  queimaMediaCents: 830_000,
};
