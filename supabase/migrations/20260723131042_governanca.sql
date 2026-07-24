-- Governança: reuniões, atas, deliberações, votos e encaminhamentos (master doc §2.5)
-- Ordem de criação: reunioes -> reuniao_pauta -> atas -> deliberacoes -> votos ->
-- encaminhamentos, porque deliberacoes.ata_id referencia atas e atas.reuniao_id
-- referencia reunioes.

create type status_deliberacao as enum
  ('rascunho', 'aberta', 'aprovada', 'rejeitada', 'expirada');
create type voto_enum as enum ('sim', 'nao', 'abstencao');
create type status_encaminhamento as enum ('aberto', 'concluido', 'cancelado');

create table reunioes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  tipo text not null,
  inicio timestamptz not null,
  fim timestamptz,
  link text,
  unique (org_id, codigo)
);

create table reuniao_pauta (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references reunioes(id) on delete cascade,
  ordem int not null,
  item text not null,
  proposto_por uuid references membros(id),
  unique (reuniao_id, ordem)
);

create table atas (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references reunioes(id) on delete cascade,
  corpo text not null,
  publicada_em timestamptz,
  publicada_por uuid references membros(id),
  hash text
);

comment on table atas is
  'Append-only: cadeia de hash (hash = sha256(hash_anterior || payload)). Sem UPDATE '
  'nem DELETE — revogados por policy em rls_policies.sql.';

create table deliberacoes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  corpo text,
  quorum_pct numeric(5,2) not null check (quorum_pct > 0 and quorum_pct <= 100),
  status status_deliberacao not null default 'rascunho',
  abre_em timestamptz,
  encerra_em timestamptz,
  origem_mensagem_id uuid references mensagens(id),
  ata_id uuid references atas(id),
  unique (org_id, codigo)
);

create table votos (
  id uuid primary key default gen_random_uuid(),
  deliberacao_id uuid not null references deliberacoes(id) on delete cascade,
  membro_id uuid not null references membros(id),
  voto voto_enum not null,
  peso_pct numeric(5,2) not null check (peso_pct >= 0 and peso_pct <= 100),
  justificativa text,
  criado_em timestamptz not null default now(),
  hash_anterior text,
  hash text,
  unique (deliberacao_id, membro_id)
);

comment on column votos.peso_pct is
  'Snapshot da participacao_pct no momento do voto. Se a participação mudar depois, a '
  'deliberação antiga mantém o resultado que teve — sem isso, deliberação passada '
  'mudaria de veredito sozinha.';
comment on table votos is
  'Append-only: sem UPDATE nem DELETE, revogados por policy em rls_policies.sql.';

create table encaminhamentos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  titulo text not null,
  responsavel_id uuid not null references membros(id),
  prazo date not null,
  status status_encaminhamento not null default 'aberto',
  origem_tipo text not null,
  origem_id uuid not null
);

comment on column encaminhamentos.origem_id is
  'Referência polimórfica (origem_tipo indica a tabela) — sem FK direta por design.';

create index reunioes_org_id_idx on reunioes(org_id);
create index reuniao_pauta_reuniao_id_idx on reuniao_pauta(reuniao_id);
create index atas_reuniao_id_idx on atas(reuniao_id);
create index deliberacoes_org_id_idx on deliberacoes(org_id);
create index votos_deliberacao_id_idx on votos(deliberacao_id);
create index encaminhamentos_org_id_idx on encaminhamentos(org_id);
create index encaminhamentos_origem_idx on encaminhamentos(origem_tipo, origem_id);
