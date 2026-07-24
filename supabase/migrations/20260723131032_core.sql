-- Núcleo: orgs e membros (master doc §2.1)
-- org_id em toda tabela desde a primeira migration (premissa arquitetural, §0).

create extension if not exists pgcrypto;

create type papel_membro as enum ('admin', 'socio', 'tecnico', 'convidado');

create table orgs (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  estagio text not null default 'concepcao',
  criada_em timestamptz not null default now()
);

create table membros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email text not null,
  papel papel_membro not null,
  participacao_pct numeric(5,2) not null default 0
    check (participacao_pct >= 0 and participacao_pct <= 100),
  ativo boolean not null default true,
  entrou_em timestamptz not null default now(),
  unique (org_id, email)
);

comment on column membros.participacao_pct is
  'Não editável por formulário. Só muda como efeito de SA-25 (participacao.aplicar), '
  'executável apenas com deliberação aprovada.';

create index membros_org_id_idx on membros(org_id);
create index membros_user_id_idx on membros(user_id);

-- Trava a única porta de entrada de participacao_pct: bloqueia UPDATE feito fora da
-- Safe Action SA-25, que deve setar app.bypass_participacao_guard=on por transação.
create or replace function bloquear_edicao_participacao()
returns trigger
language plpgsql
as $$
begin
  if new.participacao_pct is distinct from old.participacao_pct
     and coalesce(current_setting('app.bypass_participacao_guard', true), 'off') <> 'on' then
    raise exception 'participacao_pct só muda via SA-25 (participacao.aplicar), com deliberação aprovada';
  end if;
  return new;
end;
$$;

create trigger trg_bloquear_edicao_participacao
  before update on membros
  for each row
  execute function bloquear_edicao_participacao();
