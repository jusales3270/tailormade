-- Suporte a "só quem criou edita/exclui o que criou": adiciona criado_por em canais/
-- documentos/reunioes (nenhuma das três tinha uma coluna de autoria — só
-- responsavel_id em documentos, que é "de quem é a responsabilidade", não "quem
-- criou o registro") e completa a RLS que faltava pra update/delete.
--
-- Linhas existentes (seed, fixture, e o que já foi criado em produção antes desta
-- migration) ficam com criado_por = null — ninguém "criou" essas via este mecanismo,
-- então ninguém pode editar/excluir por aqui. Isso é intencional: protege o checklist
-- padrão e os canais default de exclusão acidental.
--
-- Ficam de fora deste mecanismo (por design, não esquecimento): votos e atas (cadeia
-- de hash append-only), deliberações, movimentos e documento_versoes — são registro de
-- governança/financeiro/proveniência, não conteúdo de sessão comum.

alter table documentos add column criado_por uuid references membros(id);
alter table reunioes add column criado_por uuid references membros(id);
alter table canais add column criado_por uuid references membros(id);

-- mensagens já tinha select/insert/update (SA-02); faltava delete.
create policy mensagens_delete on mensagens for delete
  using (autor_id in (select id from membros where user_id = auth.uid()));

-- reuniao_pauta só tinha select/insert; faltava update/delete pro autor do item
-- (proposto_por) poder corrigir/remover o que ele mesmo propôs.
create policy reuniao_pauta_update on reuniao_pauta for update
  using (proposto_por in (select id from membros where user_id = auth.uid()))
  with check (proposto_por in (select id from membros where user_id = auth.uid()));

create policy reuniao_pauta_delete on reuniao_pauta for delete
  using (proposto_por in (select id from membros where user_id = auth.uid()));
