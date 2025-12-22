-- Enable pg_cron extension
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Create a scheduled job to run every hour
-- Loop through rules or just call the function that handles all rules?
-- Our Edge Function handles all enabled rules, so we just call it once.

select cron.schedule(
    'invoke-automation-evaluator', -- Job name
    '0 * * * *',                   -- Every hour (at minute 0)
    $$
    select
      net.http_post(
          url:='https://project-ref.supabase.co/functions/v1/automation-evaluator',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
