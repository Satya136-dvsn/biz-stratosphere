create policy "Allow users to manage their own datasets" on datasets for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

insert into
  storage.buckets (id, name, public)
values
  ('datasets', 'datasets', true);

create policy "Allow users to upload to datasets bucket" on storage.objects for insert with check (bucket_id = 'datasets' and auth.uid() = owner);
create policy "Allow users to manage their own files in datasets bucket" on storage.objects for all using (bucket_id = 'datasets' and auth.uid() = owner);
