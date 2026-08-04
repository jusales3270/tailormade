-- Sócio passa a operar a plataforma inteira, não só a parte de registro.
--
-- Diagnóstico que motivou esta migration: com a sessão real de um sócio em produção,
-- criar documento, subir arquivo e lançar movimento já funcionavam — mas
-- `insert into canais` e `insert into fases` retornavam "new row violates row-level
-- security policy". As duas eram as últimas funcionalidades de uso diário ainda presas
-- em admin, e a Trilha era a pior delas: sem `fases` e `fase_itens` graváveis, o
-- checklist de fundação só podia ser montado por SQL.
--
-- O que continua exclusivo de admin, de propósito — é governança de acesso e de
-- sociedade, não funcionalidade:
--   membros_insert_admin / membros_update_admin   convidar e desativar membro
--   canal_membros_write_admin                     whitelist de canal do convidado
--   documento_grupo_acessos_write_admin           whitelist de documento do convidado
--   auditoria_select                              trilha de auditoria e dossiê
--   participacao.aplicar (SA-25)                  quadro societário

-- ─────────────────────────── canais ───────────────────────────

-- Continua `for all` (e não um insert isolado) pelo motivo documentado em
-- 20260726150000_canais_rls_returning_fix.sql: o RETURNING do INSERT é filtrado pela
-- policy de SELECT, e pode_ver_canal() faz self-join que não enxerga a linha recém
-- inserida. O USING sem self-join desta policy é o que cobre esse caso.
drop policy canais_write_admin on canais;

create policy canais_write on canais for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

-- ─────────────────────────── trilha ───────────────────────────

drop policy fases_write_admin on fases;

create policy fases_write on fases for all
  using (papel_atual(org_id) in ('admin', 'socio'))
  with check (papel_atual(org_id) in ('admin', 'socio'));

-- fase_itens só tinha select e update (marcar/desmarcar concluído). Sem insert e delete
-- não havia como cadastrar o checklist de uma fase pela aplicação — o conteúdo da
-- Trilha vinha inteiro do seed, que não roda em produção.
create policy fase_itens_insert on fase_itens for insert
  with check (exists (
    select 1 from fases f
    where f.id = fase_itens.fase_id
      and papel_atual(f.org_id) in ('admin', 'socio')
  ));

create policy fase_itens_delete on fase_itens for delete
  using (exists (
    select 1 from fases f
    where f.id = fase_itens.fase_id
      and papel_atual(f.org_id) in ('admin', 'socio')
  ));

-- ─────────────────────────── aportes ───────────────────────────

-- aportes_write já era ('admin','socio') — a tabela nunca foi o gargalo. O que faltava
-- era tela e Safe Action; ficam em aporte-criar.ts. Sem policy nova aqui.
