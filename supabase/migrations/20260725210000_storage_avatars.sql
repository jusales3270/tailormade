-- Bucket de storage para o avatar pessoal do usuário (tela de Configurações).
--
-- Caminho: {user_id}/avatar.{ext}. Nome fixo (sem versão) porque, ao contrário de
-- documento_versoes, reenvio de avatar deve sobrescrever — não faz sentido acumular
-- histórico de avatares antigos.
--
-- Privado e restrito ao próprio dono: avatar é dado de perfil pessoal, não de
-- organização, então não usa pode_ver_documento() nem qualquer checagem de papel/org —
-- só auth.uid() == primeiro segmento do caminho.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy avatars_storage_select on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_storage_insert on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_storage_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_storage_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
