-- Auditoria (master doc §2.7) e Sugestões (master doc §2.8)

create table auditoria (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ator_id uuid references membros(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  antes jsonb,
  depois jsonb,
  ip text,
  criado_em timestamptz not null default now()
);

comment on table auditoria is
  'Escrita pelo runtime de Safe Actions, nunca manualmente. Append-only.';

create index auditoria_org_id_idx on auditoria(org_id);
create index auditoria_entidade_idx on auditoria(entidade, entidade_id);

create type tipo_sugestao as enum
  ('movimento', 'aporte', 'encaminhamento', 'documento', 'deliberacao');
create type status_sugestao as enum ('pendente', 'promovida', 'descartada');

create table sugestoes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  mensagem_id uuid not null references mensagens(id) on delete cascade,
  tipo tipo_sugestao not null,
  payload jsonb not null,
  confianca numeric(4,3) check (confianca >= 0 and confianca <= 1),
  status status_sugestao not null default 'pendente',
  promovida_em timestamptz,
  promovida_por uuid references membros(id),
  registro_id uuid,
  criado_em timestamptz not null default now()
);

comment on column sugestoes.registro_id is
  'Só preenchido na promoção (SA-27); aponta para a linha real criada pela Safe Action '
  'de destino (SA-20, SA-22, SA-18…). O payload confirmado pelo humano vence o sugerido.';

create index sugestoes_org_id_idx on sugestoes(org_id);
create index sugestoes_status_idx on sugestoes(status);
create index sugestoes_mensagem_id_idx on sugestoes(mensagem_id);
