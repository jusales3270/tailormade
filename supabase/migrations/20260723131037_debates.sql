-- Debates: canais, mensagens e livro de registros (master doc §2.3)
-- canal_membros é infraestrutura nova, não estava no master doc original: é a whitelist
-- que a RLS do papel 'convidado' precisa para restringir acesso ao canal onde foi
-- incluído (seção 3 da tabela de papéis). Documentado no MASTER.md junto com esta migration.

create table canais (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  slug text not null,
  nome text not null,
  descricao text,
  arquivado boolean not null default false,
  unique (org_id, slug)
);

create table canal_membros (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references canais(id) on delete cascade,
  membro_id uuid not null references membros(id) on delete cascade,
  adicionado_em timestamptz not null default now(),
  unique (canal_id, membro_id)
);

comment on table canal_membros is
  'Whitelist de acesso por canal, consultada pela RLS apenas para o papel convidado. '
  'admin/socio/tecnico enxergam todos os canais da org independente desta tabela.';

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references canais(id) on delete cascade,
  autor_id uuid not null references membros(id),
  corpo text not null,
  respondendo_a uuid references mensagens(id),
  criado_em timestamptz not null default now(),
  editado_em timestamptz
);

create table mensagem_versoes (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references mensagens(id) on delete cascade,
  corpo_anterior text not null,
  editado_em timestamptz not null default now()
);

create table registros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  codigo text not null,
  mensagem_id uuid not null references mensagens(id),
  texto_snapshot text not null,
  guardado_por uuid references membros(id),
  guardado_em timestamptz not null default now(),
  unique (org_id, codigo)
);

comment on column registros.texto_snapshot is
  'Congela o texto no momento em que a mensagem foi guardada. Editar a mensagem '
  'original depois não altera o registro — livro de registro é memória, não espelho.';

create index canais_org_id_idx on canais(org_id);
create index canal_membros_membro_id_idx on canal_membros(membro_id);
create index mensagens_canal_id_idx on mensagens(canal_id);
create index mensagem_versoes_mensagem_id_idx on mensagem_versoes(mensagem_id);
create index registros_org_id_idx on registros(org_id);
create index registros_mensagem_id_idx on registros(mensagem_id);
