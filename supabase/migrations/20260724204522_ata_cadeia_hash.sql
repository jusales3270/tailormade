-- T-014: cadeia de hash de atas, mesmo padrão de votos (voto_cadeia_hash.sql).
--
-- Uma reunião normalmente tem só uma ata, então a cadeia não faz sentido por reunião —
-- encadeia por org: a linha do tempo de todas as atas já publicadas daquela fundação,
-- prova de que nenhuma foi inserida fora de ordem ou alterada depois (append-only).

create or replace function computar_hash_ata()
returns trigger
language plpgsql
as $$
declare
  org uuid;
  ultimo_hash text;
  payload text;
begin
  select org_id into org from reunioes where id = new.reuniao_id;

  -- trava a org: serializa publicações de ata concorrentes na mesma fundação.
  perform 1 from orgs where id = org for update;

  select a.hash into ultimo_hash
  from atas a
  join reunioes r on r.id = a.reuniao_id
  where r.org_id = org
  order by a.seq desc
  limit 1;

  payload := new.reuniao_id::text || '|' || coalesce(new.publicada_por::text, '') || '|' || new.corpo;

  new.hash_anterior := ultimo_hash;
  new.hash := encode(digest(coalesce(ultimo_hash, '') || payload, 'sha256'), 'hex');

  return new;
end;
$$;

create trigger trg_computar_hash_ata
  before insert on atas
  for each row
  execute function computar_hash_ata();
