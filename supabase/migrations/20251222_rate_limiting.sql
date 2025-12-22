-- Create a table to store rate limit counters
create table if not exists rate_limits (
  key text primary key,
  count integer default 0,
  last_request timestamp with time zone default now()
);

-- Turn on RLS but allow service role full access
alter table rate_limits enable row level security;
create policy "Service role can manage rate limits"
  on rate_limits
  using (true);

-- Function to check and update rate limit
-- Returns true if request is allowed, false if limit exceeded
create or replace function check_rate_limit(
  limit_key text,
  max_requests integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  current_count integer;
  last_req timestamp with time zone;
  is_allowed boolean;
begin
  -- Delete old entries to keep table small (garbage collection on write)
  -- In production, this might be a separate cron job, but here we do it opportunistically/lazy
  -- or we just handle the specific key.
  
  insert into rate_limits (key, count, last_request)
  values (limit_key, 1, now())
  on conflict (key)
  do update set
    count = case 
      when rate_limits.last_request < now() - (window_seconds || ' seconds')::interval then 1
      else rate_limits.count + 1
    end,
    last_request = now()
  returning count into current_count;

  return current_count <= max_requests;
end;
$$;
