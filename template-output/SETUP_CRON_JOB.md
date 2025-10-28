# Cron Job Setup - Final Step

## ✅ Deployment Status

**All automated deployment steps are complete:**
- ✅ DateTimePicker dependency installed
- ✅ Database migration applied successfully
- ✅ Edge functions deployed and active:
  - `register-push-token` (v1)
  - `send-scheduled-notifications` (v1)

**View your functions**: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/functions

---

## 🎯 Final Step: Set Up Cron Job

You need to configure the cron job to automatically run the notification processor. Choose one of these methods:

### Method 1: Supabase Dashboard (Recommended - 2 minutes)

1. Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/database/cron-jobs

2. Click **"Create a new cron job"**

3. Fill in the form:
   - **Name**: `send-scheduled-notifications`
   - **Schedule**: `0 * * * *` (runs every hour)
     - Alternative: `*/15 * * * *` (runs every 15 minutes for more frequent checks)
   - **Type**: Select **"Supabase Edge Function"**
   - **Function**: Select **"send-scheduled-notifications"** from dropdown
   - **HTTP Method**: POST

4. Click **"Create"**

5. Done! The cron job will now run automatically.

---

### Method 2: SQL Command (Alternative)

If you prefer SQL, run this in the Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run every hour
SELECT cron.schedule(
  'send-scheduled-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  ) AS request_id;
  $$
);
```

**Note**: Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from:
https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/settings/api

---

## 📅 Cron Schedule Options

Choose based on how often you want to check for notifications:

| Schedule        | Description                | Best For                          |
|----------------|----------------------------|-----------------------------------|
| `0 * * * *`    | Every hour                 | Normal use (recommended)          |
| `*/15 * * * *` | Every 15 minutes           | More responsive notifications     |
| `*/30 * * * *` | Every 30 minutes           | Balance between frequency & cost  |
| `0 */2 * * *`  | Every 2 hours              | Less frequent checks              |
| `0 9 * * *`    | Daily at 9 AM UTC          | Once-daily batch processing       |

---

## 🧪 Testing Your Setup

### 1. Verify Cron Job is Created

Run this SQL query:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-scheduled-notifications';
```

### 2. Create a Test Event

1. Run the app on a physical device
2. Navigate to `/events/create`
3. Create a test reminder:
   - Type: Bill
   - Title: "Test Notification"
   - Due Date: Today
   - Recurrence: One time
   - Notification: 0 days before at [current time + 5 minutes]
4. Save the event

### 3. Wait for Notification

- Wait for the scheduled time
- Or manually trigger the function:

```bash
curl -X POST https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. Check Logs

View edge function logs:
```bash
npx supabase functions logs send-scheduled-notifications --tail
```

Or check the notification queue:
```sql
SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 10;
```

---

## 🔍 Monitoring

### View Cron Job History

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
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-scheduled-notifications')
ORDER BY start_time DESC
LIMIT 20;
```

### Check Function Logs

Dashboard: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_REF/functions/send-scheduled-notifications/logs

### Verify Tables

```sql
-- Check if events exist
SELECT COUNT(*) FROM events WHERE is_active = true;

-- Check if users have push tokens
SELECT COUNT(*) FROM user_api_keys WHERE expo_push_token IS NOT NULL;

-- Check notification queue
SELECT status, COUNT(*) FROM notification_queue GROUP BY status;
```

---

## 🎉 You're All Set!

Once the cron job is configured, your notification system is fully operational:

- ✅ Users can create recurring reminders
- ✅ Multiple notification times per event
- ✅ Automatic server-side processing
- ✅ Push notifications via Expo
- ✅ Deduplication and error handling

**Next Steps**:
1. Set up the cron job using Method 1 above
2. Test with a sample event
3. Monitor the logs for the first few runs
4. Add a link to `/events` in your app navigation

**Need Help?**
- Full documentation: `NOTIFICATION_SYSTEM.md`
- Edge functions guide: `supabase/functions/README.md`
- Check function logs for any issues

Enjoy your new notification system! 🚀
