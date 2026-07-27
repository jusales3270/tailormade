-- Três mudanças pedidas de uma vez:
--
-- 1. Perfil visível para todos. Nome e foto viviam em auth.users.user_metadata, que só
--    o próprio dono lê — ou seja, o avatar não aparecia para mais ninguém, o que torna
--    o recurso inútil. Passam a viver em `membros`, que todo mundo da org já enxerga.
--
-- 2. Financeiro sem aprovação. Movimento vira checkpoint: sobe e aparece no caixa na
--    hora. O default do status passa a 'pago' e o CHECK de aprovador some junto com a
--    regra de segregação (aprovador ≠ solicitante).
--
-- 3. Quadro de avisos. Os avisos são derivados dos próprios registros (reunião marcada,
--    despesa lançada, documento criado…), então não há tabela de avisos — só o que o
--    feed não consegue derivar: quem já leu o quê.

-- ─────────────────────────── 1. perfil visível ───────────────────────────

alter table membros add column avatar_path text;

comment on column membros.avatar_path is
  'Caminho do avatar no bucket `avatars`. Fica aqui, e não em auth.users.user_metadata, '
  'porque a foto precisa ser visível para os outros membros da organização.';

-- Bucket público: avatar não é dado sensível e, público, dispensa gerar signed URL a
-- cada render do shell (que aparece em toda página do painel). Escrita continua
-- restrita ao dono pelas policies de INSERT/UPDATE/DELETE já existentes.
update storage.buckets set public = true where id = 'avatars';

drop policy if exists avatars_storage_select on storage.objects;

create policy avatars_storage_select on storage.objects for select
  using (bucket_id = 'avatars');

-- membros_update_admin restringe UPDATE a admin, e é para continuar assim: papel e
-- participacao_pct não podem ser auto-atribuídos. Mas cada um precisa poder editar o
-- próprio nome e foto. RLS não filtra por coluna, então a saída é esta função
-- SECURITY DEFINER: ela toca exclusivamente nome/avatar_path, exclusivamente na linha
-- de quem chamou. Sem ela, um sócio editando o perfil viraria admin.
create or replace function atualizar_meu_perfil(novo_nome text, novo_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- nullif(..., ''): o chamador manda string vazia para "sem foto", já que a
  -- assinatura gerada para o cliente não aceita null nos parâmetros.
  update membros
     set nome = coalesce(nullif(novo_nome, ''), nome),
         avatar_path = nullif(coalesce(novo_avatar_path, avatar_path), '')
   where user_id = auth.uid()
     and ativo;
end;
$$;

revoke all on function atualizar_meu_perfil(text, text) from public;
grant execute on function atualizar_meu_perfil(text, text) to authenticated;

-- ─────────────────────────── 2. financeiro sem aprovação ───────────────────────────

alter table movimentos alter column status set default 'pago';

alter table movimentos drop constraint if exists movimentos_check;

-- Lançamentos que ficaram presos em aguarda_aprovacao viram pagos: sem ninguém para
-- aprovar, eles nunca sairiam desse estado e não entrariam no caixa.
update movimentos set status = 'pago' where status = 'aguarda_aprovacao';

-- ─────────────────────────── 3. avisos lidos ───────────────────────────

-- Sem tabela de avisos: cada aviso é derivado do registro que o originou (reuniao,
-- movimento, documento, deliberacao), então a única coisa que precisa ser persistida é
-- a leitura. `aviso_chave` é "<tipo>:<uuid>" do registro de origem.
create table avisos_lidos (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid not null references membros(id) on delete cascade,
  aviso_chave text not null,
  lido_em timestamptz not null default now(),
  unique (membro_id, aviso_chave)
);

create index avisos_lidos_membro_id_idx on avisos_lidos (membro_id);

alter table avisos_lidos enable row level security;

-- Leitura é estado pessoal: cada um só enxerga e mexe nas próprias marcações.
create policy avisos_lidos_select on avisos_lidos for select
  using (membro_id in (select id from membros where user_id = auth.uid()));

create policy avisos_lidos_insert on avisos_lidos for insert
  with check (membro_id in (select id from membros where user_id = auth.uid()));

create policy avisos_lidos_delete on avisos_lidos for delete
  using (membro_id in (select id from membros where user_id = auth.uid()));
