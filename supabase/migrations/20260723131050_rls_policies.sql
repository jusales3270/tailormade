-- RLS: todas as tabelas com RLS ligado, sem exceção (master doc §3).
--
-- Esta migration cobre isolamento de tenant (org_id) e escopo por papel. As regras
-- finas de cada Safe Action (idempotência de webhook, cálculo de quórum, fail-closed
-- de ata sem responsável etc.) são responsabilidade do runtime de Safe Actions (T-006),
-- que roda com a sessão do usuário e portanto ainda respeita estas policies.
--
-- Convenção: tabelas append-only (votos, atas, mensagem_versoes, registros, auditoria)
-- recebem policy de select/insert mas nenhuma de update/delete — como RLS nega por
-- padrão o que não tem policy permissiva, a ausência é a trava.
--
-- RLS restringe LINHAS, não substitui o GRANT de tabela: sem privilégio SQL básico o
-- Postgres nem chega a avaliar as policies. `authenticated` precisa do GRANT abaixo em
-- toda tabela — a policy é que decide quais linhas cada um efetivamente lê ou escreve.
--
-- `service_role` também precisa do GRANT, mesmo bypassando RLS: BYPASSRLS só pula a
-- avaliação de policy, não substitui o privilégio de tabela do Postgres. É o client do
-- runtime de Safe Actions (T-006) que escreve em auditoria — sem isso, "permission
-- denied for table auditoria" mesmo como service_role.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

-- ─────────────────────────── funções auxiliares ───────────────────────────

create or replace function membro_ativo_org(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membros
    where org_id = check_org_id
      and user_id = auth.uid()
      and ativo
  );
$$;

create or replace function papel_atual(check_org_id uuid)
returns papel_membro
language sql
stable
security definer
set search_path = public
as $$
  select papel from membros
  where org_id = check_org_id
    and user_id = auth.uid()
    and ativo
  limit 1;
$$;

create or replace function pode_ver_canal(check_canal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from canais c
    join membros m on m.org_id = c.org_id
    where c.id = check_canal_id
      and m.user_id = auth.uid()
      and m.ativo
      and (
        m.papel <> 'convidado'
        or exists (
          select 1 from canal_membros cm
          where cm.canal_id = c.id and cm.membro_id = m.id
        )
      )
  );
$$;

create or replace function pode_ver_documento(check_documento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from documentos d
    join membros m on m.org_id = d.org_id
    where d.id = check_documento_id
      and m.user_id = auth.uid()
      and m.ativo
      and (
        m.papel <> 'convidado'
        or exists (
          select 1 from documento_grupo_acessos dga
          where dga.membro_id = m.id and dga.grupo = d.grupo
        )
      )
  );
$$;

-- ─────────────────────────── orgs ───────────────────────────

alter table orgs enable row level security;

create policy orgs_select on orgs for select
  using (membro_ativo_org(id));

-- ─────────────────────────── membros ───────────────────────────

alter table membros enable row level security;

create policy membros_select on membros for select
  using (membro_ativo_org(org_id));

create policy membros_insert_admin on membros for insert
  with check (papel_atual(org_id) = 'admin');

create policy membros_update_admin on membros for update
  using (papel_atual(org_id) = 'admin')
  with check (papel_atual(org_id) = 'admin');
-- Sem policy de delete: SA-24 nunca deleta, só desativa (ativo=false).

-- ─────────────────────────── trilha ───────────────────────────

alter table fases enable row level security;
alter table fase_itens enable row level security;

create policy fases_select on fases for select
  using (membro_ativo_org(org_id));

create policy fases_write_admin on fases for all
  using (papel_atual(org_id) = 'admin')
  with check (papel_atual(org_id) = 'admin');

create policy fase_itens_select on fase_itens for select
  using (exists (
    select 1 from fases f where f.id = fase_itens.fase_id and membro_ativo_org(f.org_id)
  ));

create policy fase_itens_update on fase_itens for update
  using (exists (
    select 1 from fases f
    where f.id = fase_itens.fase_id
      and papel_atual(f.org_id) in ('admin', 'socio', 'tecnico')
  ))
  with check (exists (
    select 1 from fases f
    where f.id = fase_itens.fase_id
      and papel_atual(f.org_id) in ('admin', 'socio', 'tecnico')
  ));

-- ─────────────────────────── debates ───────────────────────────

alter table canais enable row level security;
alter table canal_membros enable row level security;
alter table mensagens enable row level security;
alter table mensagem_versoes enable row level security;
alter table registros enable row level security;

create policy canais_select on canais for select
  using (pode_ver_canal(id));

create policy canais_insert_admin on canais for insert
  with check (papel_atual(org_id) = 'admin');

create policy canal_membros_select on canal_membros for select
  using (exists (
    select 1 from canais c where c.id = canal_membros.canal_id and papel_atual(c.org_id) = 'admin'
  ) or membro_id in (select id from membros where user_id = auth.uid()));

create policy canal_membros_write_admin on canal_membros for insert
  with check (exists (
    select 1 from canais c where c.id = canal_membros.canal_id and papel_atual(c.org_id) = 'admin'
  ));

create policy mensagens_select on mensagens for select
  using (pode_ver_canal(canal_id));

create policy mensagens_insert on mensagens for insert
  with check (pode_ver_canal(canal_id) and autor_id in (
    select id from membros where user_id = auth.uid()
  ));

-- SA-02 (mensagem.editar): só o autor edita a própria mensagem. A janela de 15 min é
-- checada na Safe Action, não aqui — RLS garante o "quem", não o "quando".
create policy mensagens_update on mensagens for update
  using (autor_id in (select id from membros where user_id = auth.uid()))
  with check (autor_id in (select id from membros where user_id = auth.uid()));

-- mensagem_versoes: append-only, sem update/delete.
create policy mensagem_versoes_select on mensagem_versoes for select
  using (exists (
    select 1 from mensagens msg where msg.id = mensagem_versoes.mensagem_id and pode_ver_canal(msg.canal_id)
  ));

-- SA-02 grava a versão anterior com a sessão do próprio autor — a policy replica o
-- mesmo guard (só o autor, só dentro do canal a que ele já tem acesso).
create policy mensagem_versoes_insert on mensagem_versoes for insert
  with check (exists (
    select 1 from mensagens msg
    where msg.id = mensagem_versoes.mensagem_id
      and pode_ver_canal(msg.canal_id)
      and msg.autor_id in (select id from membros where user_id = auth.uid())
  ));

-- registros: append-only (livro de registros não reescreve o passado).
create policy registros_select on registros for select
  using (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

create policy registros_insert on registros for insert
  with check (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

-- ─────────────────────────── documentos ───────────────────────────

alter table documentos enable row level security;
alter table documento_versoes enable row level security;
alter table assinaturas enable row level security;
alter table documento_grupo_acessos enable row level security;

create policy documentos_select on documentos for select
  using (pode_ver_documento(id));

create policy documentos_write on documentos for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

create policy documento_versoes_select on documento_versoes for select
  using (exists (
    select 1 from documentos d where d.id = documento_versoes.documento_id and pode_ver_documento(d.id)
  ));

create policy documento_versoes_insert on documento_versoes for insert
  with check (exists (
    select 1 from documentos d
    where d.id = documento_versoes.documento_id
      and papel_atual(d.org_id) <> 'convidado'
  ));

create policy assinaturas_select on assinaturas for select
  using (exists (
    select 1 from documento_versoes dv
    join documentos d on d.id = dv.documento_id
    where dv.id = assinaturas.documento_versao_id and pode_ver_documento(d.id)
  ));

create policy documento_grupo_acessos_select on documento_grupo_acessos for select
  using (exists (
    select 1 from membros m where m.id = documento_grupo_acessos.membro_id and papel_atual(m.org_id) = 'admin'
  ) or membro_id in (select id from membros where user_id = auth.uid()));

create policy documento_grupo_acessos_write_admin on documento_grupo_acessos for insert
  with check (exists (
    select 1 from membros m where m.id = documento_grupo_acessos.membro_id and papel_atual(m.org_id) = 'admin'
  ));

-- ─────────────────────────── governança ───────────────────────────

alter table reunioes enable row level security;
alter table reuniao_pauta enable row level security;
alter table atas enable row level security;
alter table deliberacoes enable row level security;
alter table votos enable row level security;
alter table encaminhamentos enable row level security;

create policy reunioes_select on reunioes for select
  using (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

create policy reunioes_write on reunioes for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

create policy reuniao_pauta_select on reuniao_pauta for select
  using (exists (
    select 1 from reunioes r
    where r.id = reuniao_pauta.reuniao_id
      and membro_ativo_org(r.org_id) and papel_atual(r.org_id) <> 'convidado'
  ));

create policy reuniao_pauta_insert on reuniao_pauta for insert
  with check (exists (
    select 1 from reunioes r
    where r.id = reuniao_pauta.reuniao_id and papel_atual(r.org_id) <> 'convidado'
  ));

-- atas: append-only (cadeia de hash) — só select e insert.
create policy atas_select on atas for select
  using (exists (
    select 1 from reunioes r
    where r.id = atas.reuniao_id and membro_ativo_org(r.org_id) and papel_atual(r.org_id) <> 'convidado'
  ));

create policy atas_insert on atas for insert
  with check (exists (
    select 1 from reunioes r
    where r.id = atas.reuniao_id and papel_atual(r.org_id) in ('admin', 'socio')
  ));

-- deliberacoes/votos: tecnico também não vê (financeiro/governança fora do escopo dele).
create policy deliberacoes_select on deliberacoes for select
  using (papel_atual(org_id) in ('admin', 'socio'));

create policy deliberacoes_write on deliberacoes for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

create policy votos_select on votos for select
  using (exists (
    select 1 from deliberacoes d
    where d.id = votos.deliberacao_id and papel_atual(d.org_id) in ('admin', 'socio')
  ));

-- votos: append-only, sem update/delete. admin tem "tudo na org" — inclui votar, já que
-- é estritamente mais acesso que socio, não um papel à parte da sociedade; só tecnico e
-- convidado ficam de fora (SA-13).
create policy votos_insert on votos for insert
  with check (exists (
    select 1 from deliberacoes d
    where d.id = votos.deliberacao_id and papel_atual(d.org_id) in ('admin', 'socio')
  ) and membro_id in (select id from membros where user_id = auth.uid()));

create policy encaminhamentos_select on encaminhamentos for select
  using (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

-- INSERT separado de UPDATE: SA-18 (criar) não tem guard de papel além de "não
-- convidado", mas SA-19 (concluir) exige responsável ou admin — "for all" com o mesmo
-- using() pra tudo deixava qualquer não-convidado concluir encaminhamento alheio.
create policy encaminhamentos_insert on encaminhamentos for insert
  with check (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

create policy encaminhamentos_update on encaminhamentos for update
  using (
    papel_atual(org_id) = 'admin'
    or responsavel_id in (select id from membros where user_id = auth.uid())
  )
  with check (
    papel_atual(org_id) = 'admin'
    or responsavel_id in (select id from membros where user_id = auth.uid())
  );

-- ─────────────────────────── financeiro ───────────────────────────
-- tecnico não acessa (master doc §3): só admin/socio em todas as tabelas abaixo.

alter table aportes enable row level security;
alter table aporte_eventos enable row level security;
alter table movimentos enable row level security;

create policy aportes_select on aportes for select
  using (papel_atual(org_id) in ('admin', 'socio'));

create policy aportes_write on aportes for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

create policy aporte_eventos_select on aporte_eventos for select
  using (exists (
    select 1 from aportes a
    where a.id = aporte_eventos.aporte_id and papel_atual(a.org_id) in ('admin', 'socio')
  ));

create policy aporte_eventos_insert on aporte_eventos for insert
  with check (exists (
    select 1 from aportes a
    where a.id = aporte_eventos.aporte_id and papel_atual(a.org_id) in ('admin', 'socio')
  ));

create policy movimentos_select on movimentos for select
  using (papel_atual(org_id) in ('admin', 'socio'));

create policy movimentos_write on movimentos for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

-- ─────────────────────────── auditoria e sugestões ───────────────────────────

alter table auditoria enable row level security;
alter table sugestoes enable row level security;

-- auditoria: só leitura pela sessão do usuário. Escrita é do runtime de Safe Actions
-- (service role, bypassa RLS por padrão) — nunca da sessão autenticada comum.
create policy auditoria_select on auditoria for select
  using (papel_atual(org_id) = 'admin');

create policy sugestoes_select on sugestoes for select
  using (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');

create policy sugestoes_update on sugestoes for update
  using (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado')
  with check (membro_ativo_org(org_id) and papel_atual(org_id) <> 'convidado');
-- Sem policy de insert: sugestao.gerar (SA-26) roda no runtime, via service role.
