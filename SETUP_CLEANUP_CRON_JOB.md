# Setup Event Cleanup Cron Job

This guide walks you through setting up the automatic event cleanup system that runs every hour.

## What This Does

The cleanup job will:
1. **Auto-deactivate** one-time events after their `due_date` passes
2. **Auto-delete** inactive one-time events (along with their schedules and notification history)

**What gets deleted**:
- ✅ One-time events with `due_date < today` (auto-deactivated then deleted)
- ✅ One-time events manually marked `is_active = false`
- ❌ **Recurring events** (monthly, weekly, custom) are NEVER deleted, even if inactive

## Prerequisites

- Your Supabase edge function `cleanup-events` must be deployed
- You need your **Supabase Service Role Key**

## Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/ftjovjfauzamebmzetfr/settings/api
2. Find the **`service_role` secret** key (NOT the anon key)
3. Copy it (starts with `eyJ...`)

⚠️ **Security Note**: This key has full database access. Never commit it to git or expose it publicly.

## Step 2: Deploy the Edge Function

Run this command to deploy the cleanup function:

```bash
npx supabase functions deploy cleanup-events
```

You should see output like:
```
Deploying cleanup-events (project ref: ftjovjfauzamebmzetfr)
...
Deployed Function cleanup-events
```

## Step 3: Run the SQL to Create Cron Job

1. Go to the SQL Editor: https://supabase.com/dashboard/project/ftjovjfauzamebmzetfr/sql/new
2. Copy and paste the SQL below
3. **Replace `YOUR_SERVICE_ROLE_KEY_HERE`** with the key from Step 1
4. Click **Run**

```sql
-- ============================================
-- Event Cleanup Cron Job Setup
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old cleanup cron job (if exists)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-events-hourly');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create cron job that runs every hour
-- Runs at :05 past each hour (e.g., 1:05, 2:05, 3:05, etc.)
SELECT cron.schedule(
  'cleanup-events-hourly',
  '5 * * * *',  -- Every hour at :05 minutes past the hour
  $$
  SELECT net.http_post(
    url := 'https://ftjovjfauzamebmzetfr.supabase.co/functions/v1/cleanup-events',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Verify the cron job was created
SELECT jobname, schedule, active, jobid
FROM cron.job
WHERE jobname = 'cleanup-events-hourly';
```

**Expected output**:
```
jobname               | schedule   | active | jobid
----------------------|------------|--------|------
cleanup-events-hourly | 5 * * * *  | t      | 12345
```

## Step 4: Verify It's Working

### Option 1: Test the function manually

Run in SQL Editor:
```sql
SELECT net.http_post(
  url := 'https://ftjovjfauzamebmzetfr.supabase.co/functions/v1/cleanup-events',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

You should see `status_code: 200` in the response.

### Option 2: Wait for the cron to run (next :05 of the hour)

After the cron job runs, check the logs:

1. Go to: https://supabase.com/dashboard/project/ftjovjfauzamebmzetfr/functions/cleanup-events/invocations
2. Look for a successful invocation
3. Click on it to see the logs showing what was cleaned up

### Option 3: Check cron job execution history

```sql
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-events-hourly')
ORDER BY start_time DESC
LIMIT 5;
```

## Troubleshooting

### Problem: Cron job shows "active = f" (false)

**Solution**: The job was disabled. Re-run the setup SQL.

### Problem: No invocations showing up

**Possible causes**:
1. Function not deployed yet (run `npx supabase functions deploy cleanup-events`)
2. Service role key is incorrect (double-check you copied the right key)
3. Cron job not created (verify with `SELECT * FROM cron.job WHERE jobname = 'cleanup-events-hourly'`)

### Problem: 401 Unauthorized errors

**Solution**: Your service role key is incorrect or missing. Update the cron job:

```sql
-- Update existing cron job with correct key
UPDATE cron.job
SET command = $$
  SELECT net.http_post(
    url := 'https://ftjovjfauzamebmzetfr.supabase.co/functions/v1/cleanup-events',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CORRECT_SERVICE_ROLE_KEY_HERE',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$$
WHERE jobname = 'cleanup-events-hourly';
```

## Changing the Schedule

The default schedule is `'5 * * * *'` (every hour at :05 minutes past).

You can change it to:
- `'*/30 * * * *'` - Every 30 minutes
- `'0 3 * * *'` - Daily at 3:00 AM
- `'0 */6 * * *'` - Every 6 hours at the top of the hour

Update the schedule:
```sql
UPDATE cron.job
SET schedule = '0 3 * * *'  -- Change to your preferred schedule
WHERE jobname = 'cleanup-events-hourly';
```

## Monitoring

To see what's being cleaned up, check the function logs after each run:

1. Go to: https://supabase.com/dashboard/project/ftjovjfauzamebmzetfr/functions/cleanup-events/invocations
2. Click on any invocation
3. Look for logs like:
   ```
   Deactivated 3 past one-time events
   Deleted 5 notification history entries
   Deleted 8 notification schedules
   Deleted 5 events
   ```

## Uninstalling

To stop the cleanup job:

```sql
SELECT cron.unschedule('cleanup-events-hourly');
```

To completely remove the edge function:

```bash
npx supabase functions delete cleanup-events
```
