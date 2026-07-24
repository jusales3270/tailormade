-- Liga auth.users a membros por e-mail (T-003: Auth + fluxo de convite por papel).
--
-- SA-23 (membro.convidar) cria a linha em membros (org_id, email, papel, user_id=null)
-- e depois chama supabase.auth.admin.inviteUserByEmail. A criação do auth.users que
-- resulta desse convite dispara este trigger, que preenche membros.user_id.
--
-- Um mesmo e-mail pode estar em membros de mais de uma org (a mesma contadora externa
-- convidada como 'convidado' em duas fundações diferentes) — por isso o UPDATE por
-- e-mail, sem LIMIT 1, cobre todas as linhas pendentes daquele e-mail de uma vez.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update membros
  set user_id = new.id
  where email = new.email and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();
