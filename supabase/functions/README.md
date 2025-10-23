# Supabase Edge Functions - Notification System

This directory contains Supabase Edge Functions for the recurring notification system.

## Functions

### 1. `register-push-token`
Stores a user's Expo push token in the database.

**Triggered by**: Mobile app (after user gets Expo push token)
**Authentication**: Requires user JWT token

**Usage from mobile app**:
```typescript
await supabase.functions.invoke('register-push-token', {
  body: {
    expo_push_token: 'ExponentPushToken[...]',
    device_info: {
      platform: 'ios',
      device_name: 'iPhone 15',
      app_version: '1.0.0'
    }
  }
});
```

### 2. `send-scheduled-notifications`
Processes all pending notifications and sends them via Expo Push API.

**Triggered by**: Supabase Cron job (hourly or every 15 minutes)
**Authentication**: Service role key (automatic from cron)

## Deployment

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy register-push-token
supabase functions deploy send-scheduled-notifications
```

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test register-push-token locally (requires local Supabase running)
supabase functions serve register-push-token
```

## Setting Up the Cron Job

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Cron Jobs**
3. Click **Create a new cron job**
4. Fill in:
   - **Name**: `send-scheduled-notifications`
   - **Schedule**: `0 * * * *` (every hour) or `*/15 * * * *` (every 15 minutes)
   - **Type**: Select "Supabase Edge Function"
   - **Function**: Select `send-scheduled-notifications`
   - **HTTP Method**: POST
5. Click **Create**

The dashboard automatically configures the service role authentication.

### Option 2: SQL Command

If you prefer SQL, run this in the SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run every hour
SELECT cron.schedule(
  'send-scheduled-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  ) AS request_id;
  $$
);
```

**Important**: Replace:
- `YOUR_PROJECT_REF` with your actual Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Project Settings → API)

### Cron Schedule Examples

```bash
*/15 * * * *   # Every 15 minutes
0 * * * *      # Every hour
0 */2 * * *    # Every 2 hours
0 9 * * *      # Every day at 9 AM UTC
0 9,17 * * *   # Every day at 9 AM and 5 PM UTC
```

### Monitor Cron Jobs

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- Unschedule a job (if needed)
SELECT cron.unschedule('send-scheduled-notifications');
```

## Testing

### Test register-push-token

```bash
# Get a test user JWT token from your Supabase Auth
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/register-push-token \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expo_push_token": "ExponentPushToken[test-token-123]",
    "device_info": {
      "platform": "ios",
      "device_name": "Test Device"
    }
  }'
```

### Test send-scheduled-notifications

```bash
# Invoke with service role key
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Check Notification Queue

```sql
-- View recent notifications
SELECT
  nq.*,
  e.title as event_title,
  e.event_type
FROM notification_queue nq
JOIN events e ON e.id = nq.event_id
ORDER BY nq.created_at DESC
LIMIT 50;

-- Check for failed notifications
SELECT * FROM notification_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Troubleshooting

### Edge Function Logs

View logs in Supabase Dashboard:
1. Go to **Edge Functions** in the sidebar
2. Click on the function name
3. View **Logs** tab

Or use CLI:
```bash
supabase functions logs send-scheduled-notifications
```

### Common Issues

**Issue**: Notifications not being sent
- Check if cron job is running: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- Check if users have push tokens: `SELECT COUNT(*) FROM user_api_keys WHERE expo_push_token IS NOT NULL;`
- Check if events are active: `SELECT * FROM events WHERE is_active = true;`
- Check edge function logs for errors

**Issue**: Invalid push tokens
- The system automatically clears invalid tokens from the database
- Users need to re-register their push token by logging in again

**Issue**: Duplicate notifications
- Check `notification_queue` for duplicate entries
- The deduplication logic uses `(user_id, event_id, DATE(scheduled_for))` as unique key

## Local Development

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve functions locally
supabase functions serve

# Test locally
curl -X POST http://localhost:54321/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer LOCAL_SERVICE_ROLE_KEY"
```

## Environment Variables

Edge functions automatically have access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

No additional environment variables are required.

## Security Notes

1. **Service Role Key**: Never expose the service role key in client-side code
2. **RLS Policies**: All tables have Row Level Security enabled
3. **User Authentication**: `register-push-token` validates user JWT
4. **CORS**: Configured to allow requests from any origin (adjust if needed)
