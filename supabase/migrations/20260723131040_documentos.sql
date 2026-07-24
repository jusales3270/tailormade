-- Documentos: cofre, versões e assinaturas (master doc §2.4)
-- documento_grupo_acessos é a contraparte de canal_membros para o papel convidado:
-- whitelist de quais grupos de documento ele pode ver.

create type status_documento as enum
  ('ausente', 'rascunho', 'revisao', 'aguarda_assinatura', 'assinado', 'vencido');
create type status_assinatura as enum ('pendente', 'assinada', 'recusada');

create table documentos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  codigo text not null,
  nome text not null,
  grupo text not null,
  responsavel_id uuid references membros(id),
  status status_documento not null default 'ausente',
  critico boolean not null default false,
  vence_em date,
  unique (org_id, codigo)
);

comment on column documentos.status is
  'status=ausente é criado antes de existir arquivo. A ausência é um registro, não um '
  'vazio — é assim que um documento crítico nunca enviado aparece marcado, em vez de '
  'simplesmente não existir.';

create table documento_versoes (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos(id) on delete cascade,
  versao int not null,
  storage_path text not null,
  hash_sha256 text not null,
  enviado_por uuid references membros(id),
  enviado_em timestamptz not null default now(),
  unique (documento_id, versao)
);

create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  documento_versao_id uuid not null references documento_versoes(id) on delete cascade,
  membro_id uuid not null references membros(id),
  status status_assinatura not null default 'pendente',
  provider text,
  provider_ref text,
  assinado_em timestamptz,
  unique (documento_versao_id, membro_id)
);

create unique index assinaturas_provider_ref_idx
  on assinaturas(provider_ref) where provider_ref is not null;

comment on column assinaturas.provider_ref is
  'Chave de idempotência do webhook de assinatura (SA-11): reentrega não duplica.';

create table documento_grupo_acessos (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid not null references membros(id) on delete cascade,
  grupo text not null,
  unique (membro_id, grupo)
);

comment on table documento_grupo_acessos is
  'Whitelist de acesso por grupo de documento, consultada pela RLS apenas para o papel '
  'convidado (contador, advogada externa).';

alter table fase_itens
  add constraint fase_itens_depende_documento_id_fkey
  foreign key (depende_documento_id) references documentos(id);

create index documentos_org_id_idx on documentos(org_id);
create index documento_versoes_documento_id_idx on documento_versoes(documento_id);
create index assinaturas_documento_versao_id_idx on assinaturas(documento_versao_id);
create index documento_grupo_acessos_membro_id_idx on documento_grupo_acessos(membro_id);
