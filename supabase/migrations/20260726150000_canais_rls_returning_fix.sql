-- Corrige RLS de `canais` para `insert ... returning id` funcionar para usuários
-- normais (não superuser).
--
-- canais_insert_admin era `FOR INSERT` só. O RETURNING de um INSERT é filtrado pela
-- policy de SELECT da tabela — que aqui é só canais_select (`pode_ver_canal(id)`).
-- pode_ver_canal faz self-join em canais pra achar org_id a partir do id
-- (`from canais c ... where c.id = check_canal_id`), e essa subquery não enxerga a
-- linha recém-inserida dentro do mesmo comando: o INSERT em si passava (WITH CHECK ok),
-- mas o RETURNING falhava com "new row violates row-level security policy for table
-- canais" — reproduzido manualmente via psql (funciona sem RETURNING, falha com).
--
-- documentos nunca teve esse problema porque documentos_write já é `FOR ALL`: o USING
-- dela (`papel_atual(org_id) in (...)`) não faz self-join e cobre o RETURNING via OR
-- com documentos_select, mesmo que pode_ver_documento tivesse o mesmo self-join.
-- Aplicando o mesmo padrão aqui: canais_write_admin substitui canais_insert_admin como
-- `FOR ALL`, então o USING (sem self-join) cobre a visibilidade do RETURNING para quem
-- acabou de criar o canal.

drop policy canais_insert_admin on canais;

create policy canais_write_admin on canais for all
  using (papel_atual(org_id) = 'admin')
  with check (papel_atual(org_id) = 'admin');
