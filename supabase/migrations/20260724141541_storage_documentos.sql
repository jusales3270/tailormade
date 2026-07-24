-- T-011: bucket de storage para os arquivos de documento_versoes.
--
-- Caminho: {documento_id}/v{n}-{nome_original}. O primeiro segmento é o documento_id —
-- dá pra reaproveitar pode_ver_documento() direto, em vez de duplicar a lógica de
-- whitelist do convidado numa segunda função só para storage.
--
-- Sem policy de update/delete: reenvio nunca sobrescreve (mesma convenção de
-- documento_versoes, "nunca sobrescreve" — master doc §4, SA-09).

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy documentos_storage_select on storage.objects for select
  using (
    bucket_id = 'documentos'
    and pode_ver_documento(((storage.foldername(name))[1])::uuid)
  );

create policy documentos_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from documentos d
      where d.id = ((storage.foldername(name))[1])::uuid
        and papel_atual(d.org_id) <> 'convidado'
    )
  );
