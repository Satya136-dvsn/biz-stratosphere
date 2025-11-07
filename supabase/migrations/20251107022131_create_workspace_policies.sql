-- Enable RLS for the new tables
alter table workspaces enable row level security;
alter table workspace_users enable row level security;

-- Policies for the workspaces table
create policy "Allow users to see the workspaces they are a member of" on workspaces for select using (
  exists (
    select 1
    from workspace_users
    where
      workspace_users.workspace_id = workspaces.id and workspace_users.user_id = auth.uid()
  )
);
create policy "Allow admins to update workspace" on workspaces for update using (
  exists (
    select 1
    from workspace_users
    where
      workspace_users.workspace_id = workspaces.id and workspace_users.user_id = auth.uid() and workspace_users.role = 'admin'
  )
);
create policy "Allow admins to delete workspace" on workspaces for delete using (
  exists (
    select 1
    from workspace_users
    where
      workspace_users.workspace_id = workspaces.id and workspace_users.user_id = auth.uid() and workspace_users.role = 'admin'
  )
);

-- Policies for the workspace_users table
create policy "Allow users to see the members of their workspaces" on workspace_users for select using (
  exists (
    select 1
    from workspace_users as wu
    where
      wu.workspace_id = workspace_users.workspace_id and wu.user_id = auth.uid()
  )
);
create policy "Allow admins to manage workspace members" on workspace_users for all using (
  exists (
    select 1
    from workspace_users as wu
    where
      wu.workspace_id = workspace_users.workspace_id and wu.user_id = auth.uid() and wu.role = 'admin'
  )
);

-- Policies for the datasets table
create policy "Allow analysts to manage datasets in their workspaces" on datasets for all using (
  exists (
    select 1
    from workspace_users
    where
      workspace_users.workspace_id = datasets.workspace_id and workspace_users.user_id = auth.uid() and (workspace_users.role = 'admin' or workspace_users.role = 'analyst')
  )
);
create policy "Allow viewers to see datasets in their workspaces" on datasets for select using (
  exists (
    select 1
    from workspace_users
    where
      workspace_users.workspace_id = datasets.workspace_id and workspace_users.user_id = auth.uid()
  )
);
