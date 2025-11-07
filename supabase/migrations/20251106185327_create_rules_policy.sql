create policy "Allow users to manage their own rules" on rules for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
