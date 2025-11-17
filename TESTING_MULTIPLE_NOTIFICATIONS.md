# Testing Multiple Notifications Per Reminder

This document describes how to test the multiple notifications per reminder feature.

## Overview

The system now supports creating multiple notifications for a single reminder. For example, a credit card payment reminder can trigger notifications at:
- 7 days before the due date
- 3 days before the due date  
- Day of the due date

## Running the Migration

Before testing, you need to apply the migration:

```bash
# From the project root
cd supabase

# Run the migration (choose one method):

# Option 1: Using Supabase CLI locally
supabase db reset

# Option 2: Apply specific migration
supabase migration up

# Option 3: If using a remote database, apply via SQL editor in Supabase Dashboard
# Copy contents of: supabase/migrations/20251117000000_add_multiple_notifications_support.sql
```

## Testing with SQL

Run the test script to verify the database triggers work correctly:

```bash
# Connect to your local Supabase database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run the test script
\i test_multiple_notifications.sql
```

Expected output:
- ✓ First test should create 3 notifications (7 days, 3 days, 0 days before)
- ✓ Second test should create 1 notification (legacy behavior)

## Testing with the Mobile App

### Prerequisites
1. Migration must be applied to your database
2. App must be running with latest code changes

### Test Steps

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Navigate to Account Settings**:
   - Open the app
   - Go to your accounts list
   - Select a credit card account
   - Tap on settings/configuration

3. **Set a Due Day**:
   - Set the "Due Day" to a day that's at least 8 days in the future
   - Tap "Save"

4. **Verify in Database**:
   ```sql
   -- Check the reminder was created
   SELECT * FROM reminders 
   WHERE account_id IS NOT NULL 
   ORDER BY created_at DESC 
   LIMIT 1;

   -- Check multiple notifications were created
   SELECT 
       r.title,
       r.due_at,
       n.scheduled_at,
       EXTRACT(DAY FROM (r.due_at - n.scheduled_at))::INTEGER as days_before,
       n.status
   FROM notifications n
   JOIN reminders r ON n.reminder_id = r.id
   WHERE r.account_id IS NOT NULL
   ORDER BY r.created_at DESC, n.scheduled_at;
   ```

5. **Expected Results**:
   - One reminder entry in the `reminders` table
   - Three notification entries in the `notifications` table
   - Notifications scheduled at 7 days, 3 days, and 0 days before the due date

## Modifying Notification Schedules

To change when notifications are sent, edit the configuration file:

**File**: `src/lib/notificationSchedules.ts`

```typescript
export const NOTIFICATION_SCHEDULES = {
    credit_card: [
        { days_before: 7, label: '7 days before' },
        { days_before: 3, label: '3 days before' },
        { days_before: 0, label: 'Day of' },
    ],
    // ... other reminder types
};
```

Changes take effect immediately for new reminders (no migration needed).

## Troubleshooting

### No notifications are created

1. **Check the migration was applied**:
   ```sql
   -- Verify the column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'reminders' 
   AND column_name = 'notify_before_schedules';
   ```

2. **Check the trigger exists**:
   ```sql
   SELECT trigger_name, event_manipulation, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_name LIKE '%notification%';
   ```

3. **Check for errors in app logs**:
   ```bash
   # Look for any errors when creating reminders
   npx expo start --clear
   ```

### Wrong number of notifications

1. **Verify the schedule configuration** in `src/lib/notificationSchedules.ts`
2. **Check the reminder record**:
   ```sql
   SELECT 
       title, 
       notify_before_schedules,
       jsonb_array_length(notify_before_schedules) as schedule_count
   FROM reminders 
   WHERE account_id IS NOT NULL 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

### Legacy notify_before conflicts

If you have old reminders with the `notify_before` field set:
- They will continue to work (backward compatibility)
- New reminders should use `notify_before_schedules` array
- The trigger checks `notify_before_schedules` first, falls back to `notify_before`

## Configuration Reference

### Days Before to Milliseconds

The database stores notification offsets in milliseconds:
- 0 days = 0
- 1 day = 86,400,000
- 3 days = 259,200,000
- 7 days = 604,800,000

The helper function `daysBeforeToMilliseconds()` in `notificationSchedules.ts` handles this conversion.

### Database Helper Function

The migration also creates a SQL helper function:

```sql
-- Convert days to milliseconds in SQL
SELECT days_to_milliseconds(7);  -- Returns 604800000
```

## Success Criteria

✅ Migration applies without errors  
✅ SQL test script passes both tests  
✅ Creating a reminder from Account Settings generates multiple notifications  
✅ Notifications are scheduled at the correct times (7d, 3d, 0d before)  
✅ Legacy reminders with single `notify_before` still work  
✅ Notification schedule can be modified by editing the config file

