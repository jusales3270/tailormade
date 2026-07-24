-- T-013: cadeia de hash de votos calculada no servidor, não no cliente.
--
-- Se o hash fosse montado em JS e só inserido, duas Safe Actions concorrentes votando
-- na mesma deliberação poderiam ler o mesmo "último hash" antes de qualquer uma
-- terminar, gerando uma bifurcação na cadeia — exatamente o tipo de furo que uma
-- cadeia de hash existe pra impedir. O trigger resolve isso de dois jeitos: (1) trava a
-- linha da deliberação antes de olhar o último voto, serializando os inserts uma a um;
-- (2) calcula hash_anterior/hash aqui dentro, então nem um bug no cliente nem um INSERT
-- manual consegue gravar um hash incoerente com a cadeia.

create or replace function computar_hash_voto()
returns trigger
language plpgsql
as $$
declare
  ultimo_hash text;
  payload text;
begin
  -- trava a deliberação: serializa os votos concorrentes desta mesma deliberação.
  perform 1 from deliberacoes where id = new.deliberacao_id for update;

  -- seq, não criado_em: linhas do mesmo INSERT multi-linha compartilham o mesmo now().
  select hash into ultimo_hash
  from votos
  where deliberacao_id = new.deliberacao_id
  order by seq desc
  limit 1;

  payload := new.deliberacao_id::text || '|' || new.membro_id::text || '|' || new.voto::text
    || '|' || new.peso_pct::text || '|' || coalesce(new.justificativa, '') || '|' || new.criado_em::text;

  new.hash_anterior := ultimo_hash;
  new.hash := encode(digest(coalesce(ultimo_hash, '') || payload, 'sha256'), 'hex');

  return new;
end;
$$;

create trigger trg_computar_hash_voto
  before insert on votos
  for each row
  execute function computar_hash_voto();
