-- Fixture do mockup (tailor-made-painel.jsx) traduzida para o schema real.
-- Critério de aceite do T-002 ("painel abre com os mesmos dados da tela") e insumo do
-- T-007 (vira fixtures/fundacao.json para testar o motor de regras).
--
-- "Hoje" na fixture = 2026-07-23 (quinta-feira), a data usada no subtítulo do Cockpit
-- no mockup. Datas relativas ("há 2 meses", "ontem" etc.) foram convertidas a partir
-- dela. membros.user_id fica NULL — a ligação com auth.users é o fluxo de convite do
-- T-003, que ainda não existe.

create extension if not exists "uuid-ossp";

-- uuid_generate_v5(uuid_ns_url(), label): id determinístico por rótulo legível, para não
-- precisar de gen_random_uuid() + joins em cada INSERT. Inline em vez de função auxiliar
-- porque o `db reset` executa seed.sql com paralelismo entre statements — uma função
-- criada e derrubada dentro do próprio arquivo corre risco de não existir mais quando um
-- statement concorrente ainda precisa dela.

-- ─────────────────────────── org ───────────────────────────

insert into orgs (id, nome, cnpj, estagio, criada_em) values
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'Tailor Made', null, 'constituicao', '2026-06-01');

-- ─────────────────────────── membros (SOCIOS) ───────────────────────────
-- O mockup só distingue tipo 'socio'/'tecnico'. Ricardo entra aqui como 'admin' (não
-- 'socio') porque alguém precisa poder convidar e configurar a org (SA-23) — sem isso
-- a fixture não teria nenhum admin. admin ⊇ socio em permissão (RLS §3), então ele
-- continua votando normalmente nas deliberações.

insert into membros (id, org_id, user_id, nome, email, papel, participacao_pct, ativo, entrou_em) values
  (uuid_generate_v5(uuid_ns_url(), 'membro:ric'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), null, 'Ricardo Alencar',   'ricardo@tailormade.co', 'admin',   30, true, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'membro:mar'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), null, 'Marina Duarte',     'marina@tailormade.co',  'socio',   25, true, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'membro:fel'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), null, 'Felipe Nakamura',   'felipe@tailormade.co',  'socio',   25, true, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'membro:ana'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), null, 'Ana Beatriz Rocha', 'ana@tailormade.co',     'socio',   20, true, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'membro:teo'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), null, 'Téo Vasconcelos',   'teo@tailormade.co',     'tecnico',  0, true, '2026-06-01');

-- ─────────────────────────── canais (CANAIS) ───────────────────────────

insert into canais (id, org_id, slug, nome, descricao, arquivado) values
  (uuid_generate_v5(uuid_ns_url(), 'canal:geral'),      uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'geral',      'geral',      'Tudo que ainda não tem casa',               false),
  (uuid_generate_v5(uuid_ns_url(), 'canal:produto'),    uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'produto',    'produto',    'Escopo, roadmap e clientes-piloto',         false),
  (uuid_generate_v5(uuid_ns_url(), 'canal:juridico'),   uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'juridico',   'juridico',   'Societário, contratos e INPI',              false),
  (uuid_generate_v5(uuid_ns_url(), 'canal:financeiro'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'financeiro', 'financeiro', 'Aportes, despesas e contabilidade',         false);

-- ─────────────────────────── mensagens (MSGS_INI) ───────────────────────────

insert into mensagens (id, canal_id, autor_id, corpo, criado_em) values
  (uuid_generate_v5(uuid_ns_url(), 'msg:m1'), uuid_generate_v5(uuid_ns_url(), 'canal:geral'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'Bom dia. Fechei com o escritório do Dr. Peçanha a revisão do contrato social. Retorno prometido para sexta.', '2026-07-23 09:12'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m2'), uuid_generate_v5(uuid_ns_url(), 'canal:geral'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'Consigo travar o escopo do produto até quarta se decidirmos hoje se o módulo de relatórios entra ou não.', '2026-07-23 09:31'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m3'), uuid_generate_v5(uuid_ns_url(), 'canal:geral'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'Proponho extraordinária quinta às 19h só para o contrato social. Quem não puder, avisa até amanhã.', '2026-07-23 10:04'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m4'), uuid_generate_v5(uuid_ns_url(), 'canal:geral'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'Quinta 19h funciona para mim.', '2026-07-23 10:10'),

  (uuid_generate_v5(uuid_ns_url(), 'msg:m5'), uuid_generate_v5(uuid_ns_url(), 'canal:produto'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'Levantei três candidatos a piloto. Dois pagam desde o primeiro mês, o terceiro quer 60 dias grátis.', '2026-07-23 08:40'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m6'), uuid_generate_v5(uuid_ns_url(), 'canal:produto'), uuid_generate_v5(uuid_ns_url(), 'membro:teo'), 'Se o terceiro exigir customização, não entra. Vira projeto e não temos gente para isso.', '2026-07-23 08:55'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m7'), uuid_generate_v5(uuid_ns_url(), 'canal:produto'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'Concordo com o Téo. Piloto serve para validar, não para faturar. Máximo três e sem customização.', '2026-07-23 11:20'),

  (uuid_generate_v5(uuid_ns_url(), 'msg:m8'),  uuid_generate_v5(uuid_ns_url(), 'canal:juridico'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'Precisamos fechar o vesting antes de registrar na Junta. Minha proposta: 4 anos, cliff de 12 meses, aceleração de 50% em caso de venda.', '2026-07-23 14:02'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m9'),  uuid_generate_v5(uuid_ns_url(), 'canal:juridico'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'Aceleração de 50% me parece alta. 25% já resolve.', '2026-07-23 14:19'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m10'), uuid_generate_v5(uuid_ns_url(), 'canal:juridico'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'Coloquei em deliberação (D-004) para não decidirmos isso por texto.', '2026-07-23 14:33'),

  (uuid_generate_v5(uuid_ns_url(), 'msg:m11'), uuid_generate_v5(uuid_ns_url(), 'canal:financeiro'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'Caixa hoje: R$ 62.400. Queima média dos últimos três meses: R$ 8.300 por mês.', '2026-07-23 16:05'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m12'), uuid_generate_v5(uuid_ns_url(), 'canal:financeiro'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'Felipe, faltam R$ 5.000 do seu aporte comprometido. Sem pressa, mas registre a data prevista.', '2026-07-23 16:06'),
  (uuid_generate_v5(uuid_ns_url(), 'msg:m13'), uuid_generate_v5(uuid_ns_url(), 'canal:financeiro'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'Dia 5 do mês que vem eu integralizo o restante.', '2026-07-23 17:41');

-- ─────────────────────────── documentos (DOCS) ───────────────────────────

insert into documentos (id, org_id, codigo, nome, grupo, responsavel_id, status, critico) values
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-01', 'Ata de fundação',             'Societário',              uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'assinado', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-02', 'NDA mútuo entre fundadores',  'Societário',              uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'assinado', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-03'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-03', 'Contrato social',             'Societário',              uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'revisao',  false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-04'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-04', 'Acordo de sócios',            'Societário',              uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'rascunho', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-05'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-05', 'Procuração contábil',         'Financeiro',              uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'aguarda_assinatura', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-06'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-06', 'Termo de cessão de código',   'Propriedade intelectual', uuid_generate_v5(uuid_ns_url(), 'membro:teo'), 'ausente',  true),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-07', 'Comprovantes de aporte',      'Financeiro',              uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'assinado', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-08'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-08', 'Política de privacidade',     'Conformidade',            uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'rascunho', false),
  (uuid_generate_v5(uuid_ns_url(), 'doc:DOC-09'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'DOC-09', 'Busca de anterioridade INPI', 'Propriedade intelectual', uuid_generate_v5(uuid_ns_url(), 'membro:teo'), 'assinado', false);

-- documento_versoes: DOC-06 fica sem versão nenhuma — "nunca enviado" é a ausência, não
-- uma linha com storage_path vazio.

insert into documento_versoes (id, documento_id, versao, storage_path, hash_sha256, enviado_por, enviado_em) values
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-01'), 1, 'documentos/DOC-01/v1.pdf', encode(digest('DOC-01:v1', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-02'), 1, 'documentos/DOC-02/v1.pdf', encode(digest('DOC-02:v1', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-03'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-03'), 3, 'documentos/DOC-03/v3.pdf', encode(digest('DOC-03:v3', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-07-22'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-04'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-04'), 2, 'documentos/DOC-04/v2.pdf', encode(digest('DOC-04:v2', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-07-18'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-05'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-05'), 1, 'documentos/DOC-05/v1.pdf', encode(digest('DOC-05:v1', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), '2026-07-15'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-07'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07'), 4, 'documentos/DOC-07/v4.pdf', encode(digest('DOC-07:v4', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), '2026-07-20'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-08'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-08'), 1, 'documentos/DOC-08/v1.pdf', encode(digest('DOC-08:v1', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-07-12'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-09'), uuid_generate_v5(uuid_ns_url(), 'doc:DOC-09'), 1, 'documentos/DOC-09/v1.pdf', encode(digest('DOC-09:v1', 'sha256'), 'hex'), uuid_generate_v5(uuid_ns_url(), 'membro:teo'), '2026-07-02');

insert into assinaturas (documento_versao_id, membro_id, status, assinado_em) values
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-01'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'assinada', '2026-05-23'),

  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'assinada', '2026-05-23'),
  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-02'), uuid_generate_v5(uuid_ns_url(), 'membro:teo'), 'assinada', '2026-05-23'),

  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-05'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'assinada', '2026-07-15'),

  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-07'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'assinada', '2026-07-20'),

  (uuid_generate_v5(uuid_ns_url(), 'docv:DOC-09'), uuid_generate_v5(uuid_ns_url(), 'membro:teo'), 'assinada', '2026-07-02');

-- ─────────────────────────── fases e itens (FASES_INI) ───────────────────────────
-- Datas iguais às do exemplo de Gantt no MASTER.md §2.2.

insert into fases (id, org_id, ordem, nome, trilho, responsavel_id, inicio_previsto, prazo) values
  (uuid_generate_v5(uuid_ns_url(), 'fase:F1'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 1, 'Concepção e alinhamento',   'legal', uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-06-01', '2026-06-20'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F2'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 2, 'Estrutura societária',      'legal', uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-06-20', '2026-08-12'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F3'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 3, 'Constituição legal',        'legal', uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-08-12', '2026-08-29'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F4'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 4, 'Infraestrutura financeira', 'op',    uuid_generate_v5(uuid_ns_url(), 'membro:ana'), '2026-08-29', '2026-09-10'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F5'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 5, 'Propriedade intelectual',   'op',    uuid_generate_v5(uuid_ns_url(), 'membro:teo'), '2026-08-29', '2026-09-24'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F6'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 6, 'Conformidade e LGPD',       'op',    uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-09-10', '2026-10-15'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F7'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 7, 'Produto — primeira versão', 'op',    uuid_generate_v5(uuid_ns_url(), 'membro:teo'), '2026-09-24', '2026-11-20'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F8'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 8, 'Entrada no mercado',        'op',    uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-11-20', '2026-12-20');

insert into fase_itens (fase_id, ordem, titulo, concluido, concluido_por, concluido_em) values
  (uuid_generate_v5(uuid_ns_url(), 'fase:F1'), 1, 'Tese do negócio escrita e aceita pelos quatro', true, uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-06-05'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F1'), 2, 'Divisão de responsabilidades definida',        true, uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-06-08'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F1'), 3, 'NDA mútuo assinado',                           true, uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-06-15'),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F2'), 1, 'Percentuais acordados em ata',                                    true,  uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-07-01'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F2'), 2, 'Cláusula de vesting e cliff',                                     false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F2'), 3, 'Regras de saída (tag along e drag along)',                        false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F2'), 4, 'Acordo de sócios revisado por advogado externo',                  false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F3'), 1, 'Consulta de viabilidade na prefeitura', true,  uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-08-15'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F3'), 2, 'Contrato social redigido',              true,  uuid_generate_v5(uuid_ns_url(), 'membro:mar'), '2026-08-20'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F3'), 3, 'Registro na Junta Comercial',            false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F3'), 4, 'CNPJ e inscrição municipal',             false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F4'), 1, 'Escolha do escritório contábil',       true,  uuid_generate_v5(uuid_ns_url(), 'membro:ana'), '2026-07-10'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F4'), 2, 'Abertura de conta PJ',                 false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F4'), 3, 'Chave PIX e emissão de nota fiscal',   false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F4'), 4, 'Política de reembolso e alçadas',      false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F5'), 1, 'Busca de anterioridade da marca',                 true,  uuid_generate_v5(uuid_ns_url(), 'membro:teo'), '2026-07-02'),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F5'), 2, 'Depósito no INPI',                                false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F5'), 3, 'Registro de domínios e contas',                   false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F5'), 4, 'Termo de cessão de propriedade do código',        false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F6'), 1, 'Mapeamento dos dados pessoais tratados',      false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F6'), 2, 'Política de privacidade e termos de uso',     false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F6'), 3, 'Encarregado de dados nomeado',                false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F7'), 1, 'Escopo mínimo congelado',                 false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F7'), 2, 'Ambiente de produção no ar',               false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F7'), 3, 'Três clientes-piloto confirmados',        false, null, null),

  (uuid_generate_v5(uuid_ns_url(), 'fase:F8'), 1, 'Tabela de preços aprovada em deliberação',       false, null, null),
  (uuid_generate_v5(uuid_ns_url(), 'fase:F8'), 2, 'Contrato-padrão de prestação de serviço',        false, null, null);

-- R02: liga o item de PI ao documento crítico ausente (DOC-06). Feito por UPDATE porque
-- fase_itens é inserida antes de documentos existirem em algumas ordens de migration.
update fase_itens set depende_documento_id = uuid_generate_v5(uuid_ns_url(), 'doc:DOC-06')
  where fase_id = uuid_generate_v5(uuid_ns_url(), 'fase:F5') and ordem = 4;

-- ─────────────────────────── reuniões, pauta e ata (REUNIOES) ───────────────────────────

insert into reunioes (id, org_id, codigo, titulo, tipo, inicio) values
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-011'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'R-011', 'Comitê semanal de fundação',    'Recorrente',      '2026-07-21 19:00'),
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-012'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'R-012', 'Comitê semanal de fundação',    'Recorrente',      '2026-07-28 19:00'),
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-013'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'R-013', 'Extraordinária — contrato social', 'Extraordinária', '2026-07-25 19:00');

insert into reuniao_pauta (reuniao_id, ordem, item, proposto_por) values
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-011'), 1, 'Escolha do contador', uuid_generate_v5(uuid_ns_url(), 'membro:ric')),
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-011'), 2, 'Aportes',             uuid_generate_v5(uuid_ns_url(), 'membro:ric')),

  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-012'), 1, 'Andamento na Junta Comercial',   uuid_generate_v5(uuid_ns_url(), 'membro:ric')),
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-012'), 2, 'Trava de escopo do produto',     uuid_generate_v5(uuid_ns_url(), 'membro:ric')),
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-012'), 3, 'Caixa e aportes',                uuid_generate_v5(uuid_ns_url(), 'membro:ric'));
  -- R-013 fica sem pauta de propósito — é o alerta R06 do mockup.

insert into atas (reuniao_id, corpo, publicada_em, publicada_por) values
  (uuid_generate_v5(uuid_ns_url(), 'reuniao:R-011'),
   'Aprovada a contratação do escritório Vértice (D-002). Ana ficou responsável por enviar a procuração contábil até 18 de julho. Felipe reportou aporte parcial.',
   '2026-07-21 21:00', uuid_generate_v5(uuid_ns_url(), 'membro:ric'));

-- ─────────────────────────── deliberações e votos (DELIBS_INI) ───────────────────────────

insert into deliberacoes (id, org_id, codigo, titulo, quorum_pct, status, abre_em, encerra_em, origem_mensagem_id) values
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-001'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'D-001', 'Divisão societária inicial de 30, 25, 25 e 20 por cento',                    100, 'aprovada', '2026-06-01', '2026-06-05', null),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-002'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'D-002', 'Contratação do escritório contábil Vértice',                                  75, 'aprovada', '2026-07-10', '2026-07-14', null),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-003'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'D-003', 'Pró-labore zero até o primeiro faturamento recorrente',                       75, 'aprovada', '2026-07-01', '2026-07-05', null),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-004'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'D-004', 'Vesting de 4 anos, cliff de 12 meses e aceleração de 50%',                    75, 'aberta',   '2026-07-23', '2026-07-25', uuid_generate_v5(uuid_ns_url(), 'msg:m10'));

-- peso_pct é o snapshot da participacao_pct de cada sócio no momento do voto.
insert into votos (deliberacao_id, membro_id, voto, peso_pct) values
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-001'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'sim', 30),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-001'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-001'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-001'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'sim', 20),

  (uuid_generate_v5(uuid_ns_url(), 'delib:D-002'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'sim', 30),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-002'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-002'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-002'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'sim', 20),

  (uuid_generate_v5(uuid_ns_url(), 'delib:D-003'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 'sim', 30),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-003'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-003'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-003'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'sim', 20),

  -- D-004 aberta: ric ainda não votou (R = "falta o seu voto"), por isso não há linha para ele.
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-004'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 'sim', 25),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-004'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 'nao', 20),
  (uuid_generate_v5(uuid_ns_url(), 'delib:D-004'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 'sim', 25);

-- ─────────────────────────── aportes (APORTES) ───────────────────────────

insert into aportes (id, org_id, membro_id, comprometido_cents, prazo) values
  (uuid_generate_v5(uuid_ns_url(), 'aporte:ric'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), 3000000, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'aporte:mar'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), uuid_generate_v5(uuid_ns_url(), 'membro:mar'), 2500000, '2026-06-01'),
  (uuid_generate_v5(uuid_ns_url(), 'aporte:fel'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), uuid_generate_v5(uuid_ns_url(), 'membro:fel'), 2500000, '2026-08-05'),
  (uuid_generate_v5(uuid_ns_url(), 'aporte:ana'), uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), uuid_generate_v5(uuid_ns_url(), 'membro:ana'), 2000000, '2026-06-01');

insert into aporte_eventos (aporte_id, valor_cents, data, comprovante_documento_id) values
  (uuid_generate_v5(uuid_ns_url(), 'aporte:ric'), 3000000, '2026-06-15', uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07')),
  (uuid_generate_v5(uuid_ns_url(), 'aporte:mar'), 2500000, '2026-06-15', uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07')),
  (uuid_generate_v5(uuid_ns_url(), 'aporte:fel'), 2000000, '2026-06-15', uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07')), -- faltam R$ 5.000 (m12/m13)
  (uuid_generate_v5(uuid_ns_url(), 'aporte:ana'), 2000000, '2026-06-15', uuid_generate_v5(uuid_ns_url(), 'doc:DOC-07'));

-- ─────────────────────────── movimentos (DESPESAS_INI) ───────────────────────────
-- Todo lançamento nasce em aguarda_aprovacao (master doc §8: sem alçada por valor).

insert into movimentos (org_id, codigo, descricao, valor_cents, categoria, direcao, status, solicitante_id, aprovador_id, competencia) values
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'E-018', 'Honorários da revisão do contrato social', 380000, 'Jurídico',       'saida', 'aguarda_aprovacao', uuid_generate_v5(uuid_ns_url(), 'membro:mar'), null,             '2026-07-01'),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'E-017', 'Taxa da Junta Comercial',                  48000,  'Legal',          'saida', 'aguarda_aprovacao', uuid_generate_v5(uuid_ns_url(), 'membro:mar'), null,             '2026-07-01'),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'E-016', 'Servidor e domínios, 12 meses',           216000, 'Infraestrutura', 'saida', 'pago',              uuid_generate_v5(uuid_ns_url(), 'membro:teo'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-07-01'),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'E-015', 'Contabilidade, mensalidade',               89000,  'Contábil',       'saida', 'pago',              uuid_generate_v5(uuid_ns_url(), 'membro:ana'), uuid_generate_v5(uuid_ns_url(), 'membro:ric'), '2026-07-01'),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'E-014', 'Depósito de marca no INPI',               142000, 'Marca',          'saida', 'previsto',          uuid_generate_v5(uuid_ns_url(), 'membro:teo'), null,             '2026-07-01');

-- ─────────────────────────── encaminhamentos (tarefas T-1..T-3) ───────────────────────────

insert into encaminhamentos (org_id, titulo, responsavel_id, prazo, status, origem_tipo, origem_id) values
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'Enviar a procuração contábil assinada',       uuid_generate_v5(uuid_ns_url(), 'membro:ana'), '2026-07-18', 'aberto', 'reuniao',   uuid_generate_v5(uuid_ns_url(), 'reuniao:R-011')),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'Confirmar presença na extraordinária de quinta', uuid_generate_v5(uuid_ns_url(), 'membro:fel'), '2026-07-24', 'aberto', 'canal',     uuid_generate_v5(uuid_ns_url(), 'canal:geral')),
  (uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'), 'Subir o termo de cessão de código',           uuid_generate_v5(uuid_ns_url(), 'membro:teo'), '2026-08-01', 'aberto', 'documento', uuid_generate_v5(uuid_ns_url(), 'doc:DOC-06'));

-- ─────────────────────────── Yuri Camargo (ADMIN EXTERNO) ───────────────────────────
-- Membro admin adicionado para acesso ao painel com login por email/senha.
-- auth.users precisa existir ANTES do INSERT em membros (FK membros_user_id_fkey).

-- 1. Usuário no Supabase Auth (local dev — insert direto em auth.users + auth.identities)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v5(uuid_ns_url(), 'auth:yuri'),
  'authenticated',
  'authenticated',
  'yuri.camargo@anorth-e.com.br',
  crypt('tm1234', gen_salt('bf')),
  now(), now(), now(),
  '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Yuri Camargo"}',
  false
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  uuid_generate_v5(uuid_ns_url(), 'auth:yuri'),
  uuid_generate_v5(uuid_ns_url(), 'auth:yuri'),
  uuid_generate_v5(uuid_ns_url(), 'auth:yuri'),
  jsonb_build_object('sub', uuid_generate_v5(uuid_ns_url(), 'auth:yuri')::text, 'email', 'yuri.camargo@anorth-e.com.br'),
  'email',
  now(), now(), now()
);

-- 2. Membro na org (user_id já existe em auth.users)
insert into membros (id, org_id, user_id, nome, email, papel, participacao_pct, ativo, entrou_em) values
  (uuid_generate_v5(uuid_ns_url(), 'membro:yuri'),
   uuid_generate_v5(uuid_ns_url(), 'org:tailor-made'),
   uuid_generate_v5(uuid_ns_url(), 'auth:yuri'),
   'Yuri Camargo',
   'yuri.camargo@anorth-e.com.br',
   'admin',
   0,
   true,
   '2026-07-28');
