-- Financeiro: aportes e movimentos (master doc §2.6)
-- Dinheiro em bigint de centavos — numeric também serve, float não.

create type direcao_movimento as enum ('entrada', 'saida');
create type status_movimento as enum
  ('previsto', 'aguarda_aprovacao', 'aprovado', 'pago', 'rejeitado');

create table aportes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  membro_id uuid not null references membros(id),
  comprometido_cents bigint not null check (comprometido_cents >= 0),
  prazo date,
  unique (org_id, membro_id)
);

create table aporte_eventos (
  id uuid primary key default gen_random_uuid(),
  aporte_id uuid not null references aportes(id) on delete cascade,
  valor_cents bigint not null check (valor_cents > 0),
  data date not null default current_date,
  comprovante_documento_id uuid references documentos(id)
);

comment on column aporte_eventos.comprovante_documento_id is
  'Exigido por SA-22 (aporte.registrar_integralizacao) na camada de aplicação.';

create table movimentos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  codigo text not null,
  descricao text not null,
  valor_cents bigint not null check (valor_cents > 0),
  categoria text not null,
  direcao direcao_movimento not null,
  status status_movimento not null default 'aguarda_aprovacao',
  solicitante_id uuid references membros(id),
  aprovador_id uuid references membros(id),
  comprovante_documento_id uuid references documentos(id),
  competencia date,
  unique (org_id, codigo),
  check (aprovador_id is null or aprovador_id <> solicitante_id)
);

comment on column movimentos.status is
  'Todo lançamento nasce em aguarda_aprovacao — decisão registrada no master doc §8: '
  'sem alçada por valor, todo movimento exige aprovação de outro sócio (SA-21).';

create index aportes_org_id_idx on aportes(org_id);
create index aporte_eventos_aporte_id_idx on aporte_eventos(aporte_id);
create index movimentos_org_id_idx on movimentos(org_id);
