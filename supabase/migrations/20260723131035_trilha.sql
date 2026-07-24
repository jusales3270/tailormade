-- Trilha: fases e fase_itens (master doc §2.2)
-- fase_itens.depende_documento_id ganha a FK para documentos na migration de documentos
-- (documentos ainda não existe neste ponto da sequência).

create type trilho_fase as enum ('legal', 'op');

create table fases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ordem int not null,
  nome text not null,
  trilho trilho_fase not null,
  responsavel_id uuid references membros(id),
  inicio_previsto date,
  prazo date,
  unique (org_id, ordem)
);

comment on column fases.inicio_previsto is
  'Preenchido na criação da fase, nunca inferido. Sem ele a fase não aparece no Gantt '
  '(o gráfico não estima, só desenha o que foi registrado — master doc §2.2).';

create table fase_itens (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references fases(id) on delete cascade,
  ordem int not null,
  titulo text not null,
  concluido boolean not null default false,
  concluido_por uuid references membros(id),
  concluido_em timestamptz,
  depende_documento_id uuid,
  unique (fase_id, ordem)
);

comment on column fase_itens.depende_documento_id is
  'Permite a regra R02: fase bloqueada quando o item depende de documento ausente ou '
  'em rascunho. FK adicionada na migration de documentos.';

create index fases_org_id_idx on fases(org_id);
create index fase_itens_fase_id_idx on fase_itens(fase_id);
