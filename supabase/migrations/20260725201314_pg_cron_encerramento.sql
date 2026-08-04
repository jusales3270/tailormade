-- T-018: pg_cron encerra deliberações vencidas sozinho (stack §1: "Encerrar deliberações
-- no prazo"; SA-14 deliberacao.encerrar: "por cron no prazo ou por quórum atingido").
--
-- O gatilho "quórum atingido" já está embutido em voto-registrar.ts (SA-13): ele muda o
-- status para 'aprovada' de forma síncrona no instante em que o quórum é alcançado. Por
-- isso nenhuma Safe Action separada de "encerrar por quórum" existe — seria código morto,
-- nada a chamaria. Esta migration cobre só o outro gatilho de SA-14: prazo vencido.
--
-- pg_cron já vem pré-carregado (shared_preload_libraries) na imagem local do Supabase —
-- só falta habilitar a extensão.
create extension if not exists pg_cron;

-- Recalcula o quórum aqui em vez de assumir "toda 'aberta' vencida é reprovada": é a
-- mesma regra R03 do motor de TypeScript, replicada em SQL só porque quem chama esta
-- função é o próprio Postgres agendado, sem sessão de usuário nem Next.js no meio — a
-- trava de "nunca decidir sem registro" vale aqui tanto quanto no motor de regras.
create or replace function encerrar_deliberacoes_vencidas()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d record;
  soma_sim numeric;
  novo_status status_deliberacao;
begin
  for d in
    select id, org_id, quorum_pct
    from deliberacoes
    where status = 'aberta' and encerra_em < now()
  loop
    select coalesce(sum(peso_pct), 0) into soma_sim
    from votos
    where deliberacao_id = d.id and voto = 'sim';

    novo_status := case when soma_sim >= d.quorum_pct then 'aprovada' else 'expirada' end;

    update deliberacoes set status = novo_status where id = d.id;

    insert into auditoria (org_id, ator_id, acao, entidade, entidade_id, antes, depois)
    values (
      d.org_id, null, 'deliberacao.encerrar', 'deliberacoes', d.id,
      jsonb_build_object('status', 'aberta'),
      jsonb_build_object('status', novo_status, 'somaSimPct', soma_sim)
    );
  end loop;
end;
$$;

comment on function encerrar_deliberacoes_vencidas() is
  'ator_id null em auditoria = ação do sistema, não de um membro (master doc §2.7).';

select cron.schedule(
  'encerrar-deliberacoes-vencidas',
  '* * * * *',
  $$select encerrar_deliberacoes_vencidas();$$
);
