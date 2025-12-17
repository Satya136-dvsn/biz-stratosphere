# Automation Scheduler Edge Function

Supabase Edge Function that executes scheduled automation rules.

## Features

- Finds rules that are due to run
- Evaluates rule conditions
- Executes actions (notifications, webhooks)
- Calculates next run times
- Logs all executions

## Deployment

Deploy to Supabase:

```bash
supabase functions deploy automation-scheduler
```

## Testing Locally

```bash
supabase functions serve automation-scheduler
```

Then trigger it:

```bash
curl -X POST http://localhost:54321/functions/v1/automation-scheduler
```

## Scheduling

This function should be called periodically by a cron job or scheduler. Options:

1. **GitHub Actions** - Run every X minutes
2. **External Cron** - cron-job.org or similar
3. **Supabase Cron** - pg_cron extension (if available)

Example GitHub Action (.github/workflows/automation-scheduler.yml):

```yaml
name: Run Automation Scheduler
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://YOUR_PROJECT.supabase.co/functions/v1/automation-scheduler
```

## Environment Variables

- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided
