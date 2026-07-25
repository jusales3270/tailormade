-- T-016: SA-25 (participacao.aplicar) é a única porta para mudar participacao_pct, e uma
-- deliberação aprovada só pode abrir essa porta uma vez — sem isso, a mesma deliberação
-- poderia ser reaplicada indefinidamente com distribuições diferentes, o que anula a trava
-- (master doc §2.1: "a trava mais importante do sistema").
alter table deliberacoes add column participacao_aplicada_em timestamptz;
