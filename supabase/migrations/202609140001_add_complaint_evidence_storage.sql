-- Store complaint images in a private Supabase Storage bucket.
alter table public.complaints
  add column if not exists image_path text
  check (image_path is null or char_length(image_path) between 40 and 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-evidence',
  'complaint-evidence',
  false,
  8388608,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Citizens can upload their complaint evidence" on storage.objects;
create policy "Citizens can upload their complaint evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Citizens can read their complaint evidence" on storage.objects;
create policy "Citizens can read their complaint evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Citizens can delete their complaint evidence" on storage.objects;
create policy "Citizens can delete their complaint evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
