begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-imports',
  'supplier-imports',
  false,
  10485760,
  array[
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
)
on conflict (id) do nothing;

create policy "Members upload supplier imports"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'supplier-imports'
  and (storage.foldername(name))[1] = 'imports'
  and public.is_business_member(((storage.foldername(name))[2])::uuid)
);

create policy "Members read supplier imports"
on storage.objects for select
to authenticated
using (
  bucket_id = 'supplier-imports'
  and (storage.foldername(name))[1] = 'imports'
  and public.is_business_member(((storage.foldername(name))[2])::uuid)
);

commit;
