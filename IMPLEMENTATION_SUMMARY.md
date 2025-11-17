# Multiple Notifications Per Reminder - Implementation Summary

## Problem Solved

Previously, the system could only create **one notification per reminder**. When setting a credit card due date, you could only get notified once (e.g., 7 days before).

Now, the system supports **multiple notifications per reminder**, allowing you to receive alerts at multiple intervals (e.g., 7 days before, 3 days before, and on the day itself).

## Solution Architecture

### 1. Configuration System (`src/lib/notificationSchedules.ts`)

Created a centralized developer-friendly configuration where you can define notification schedules per reminder type:

```typescript
export const NOTIFICATION_SCHEDULES = {
    credit_card: [
        { days_before: 7, label: '7 days before' },
        { days_before: 3, label: '3 days before' },
        { days_before: 0, label: 'Day of' },
    ],
    bill: [
        { days_before: 7, label: '1 week before' },
        { days_before: 1, label: '1 day before' },
    ],
    budget_review: [{ days_before: 0, label: 'Day of' }],
};
```

**Key Functions**:

- `getNotificationSchedule(type)` - Returns array of days_before values
- `daysBeforeToMilliseconds(days)` - Converts days to milliseconds for database
- `millisecondsToDaysBefore(ms)` - Converts milliseconds back to days

### 2. Database Changes (`supabase/migrations/20251117000000_add_multiple_notifications_support.sql`)

**Schema Changes**:

- Added `notify_before_schedules` JSONB column to `reminders` table
- Stores array of millisecond offsets: `[604800000, 259200000, 0]` = [7d, 3d, 0d]

**Trigger Function** (`create_notifications_for_reminder()`):

- Replaced single-notification trigger with multi-notification trigger
- Iterates over `notify_before_schedules` array to create multiple notification entries
- Maintains backward compatibility with legacy `notify_before` field
- Falls back to day-of notification if no schedules specified

**Helper Function**:

- `days_to_milliseconds(days)` - SQL helper for easier schedule creation

### 3. API Updates (`src/lib/eventsApi.ts`)

**Interface Changes**:

```typescript
export interface CreateReminderData {
    // ... other fields
    notify_before?: number; // Legacy support
    notify_before_schedules?: number[]; // New: array of days_before
}
```

**Function Updates**:

- `createReminder()` now accepts `notify_before_schedules` array
- Automatically converts days to milliseconds before database insert
- Prefers new array format over legacy single value

### 4. Component Integration (`src/features/accounts/components/settings/AccountSettings.tsx`)

Updated the account settings component to use the new notification schedule system:

```typescript
// Get notification schedule for credit card reminders
const notificationSchedule = getNotificationSchedule('credit_card');

await createReminder({
    title: `${account.display_name} Payment Due`,
    body: `${account.display_name} Payment Due`,
    due_at: dueDateString,
    notify_before_schedules: notificationSchedule, // [7, 3, 0]
    is_active: true,
    account_id: String(account.id),
});
```

## Files Created/Modified

### New Files

1. `src/lib/notificationSchedules.ts` - Configuration system
2. `supabase/migrations/20251117000000_add_multiple_notifications_support.sql` - Database migration
3. `test_multiple_notifications.sql` - SQL test script
4. `TESTING_MULTIPLE_NOTIFICATIONS.md` - Testing guide

### Modified Files

1. `src/lib/eventsApi.ts` - Added multiple schedules support
2. `src/features/accounts/components/settings/AccountSettings.tsx` - Uses new notification system

## How It Works

### Flow Diagram

```
User sets due day in Account Settings
           ↓
AccountSettings.handleSaveAccountSettings()
           ↓
getNotificationSchedule('credit_card') → [7, 3, 0]
           ↓
createReminder({ notify_before_schedules: [7, 3, 0] })
           ↓
API converts to milliseconds: [604800000, 259200000, 0]
           ↓
Insert into reminders table with notify_before_schedules JSONB
           ↓
Database trigger: create_notifications_for_reminder()
           ↓
Loop through schedules array and create 3 notification entries
           ↓
3 notifications scheduled at:
  - due_at - 7 days
  - due_at - 3 days
  - due_at (day of)
```

### Example Database Records

**Reminder**:

```sql
id: "abc-123"
title: "Chase Sapphire Payment Due"
due_at: "2025-11-25T00:00:00Z"
notify_before_schedules: [604800000, 259200000, 0]
```

**Notifications** (created automatically by trigger):

```sql
1. scheduled_at: "2025-11-18T00:00:00Z" (7 days before)
2. scheduled_at: "2025-11-22T00:00:00Z" (3 days before)
3. scheduled_at: "2025-11-25T00:00:00Z" (day of)
```

## Benefits

### ✅ For Developers

- **Easy Configuration**: Change notification timing in one place (`notificationSchedules.ts`)
- **Type-Safe**: Full TypeScript support with interfaces
- **Flexible**: Different reminder types can have different schedules
- **No API Changes**: Database handles complexity via triggers

### ✅ For Users

- **Better Reminders**: Multiple notifications increase awareness
- **Timely Alerts**: Get reminded at strategic intervals (7d, 3d, day-of)
- **Automatic**: Set once, notifications are created automatically

### ✅ For Maintenance

- **Centralized Config**: All schedules in one file
- **Backward Compatible**: Old reminders continue to work
- **Self-Documenting**: Clear labels for each schedule
- **Testable**: SQL test script verifies behavior

## Testing

### Quick Test (SQL)

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
\i test_multiple_notifications.sql
```

### Integration Test (Mobile App)

1. Open app and navigate to a credit card account
2. Set a due day (8+ days in future)
3. Save settings
4. Check database for 3 notification entries

See `TESTING_MULTIPLE_NOTIFICATIONS.md` for detailed testing instructions.

## Next Steps

### To Apply This Implementation

1. **Run the migration**:

    ```bash
    cd supabase
    supabase db reset
    # or
    supabase migration up
    ```

2. **Test it works**:

    ```bash
    psql postgresql://postgres:postgres@localhost:54322/postgres
    \i test_multiple_notifications.sql
    ```

3. **Customize schedules** (optional):
   Edit `src/lib/notificationSchedules.ts` to adjust timing

### Future Enhancements

1. **User-Configurable Schedules**: Allow users to choose their own notification timing
2. **Time-of-Day**: Support different notification times (morning vs evening)
3. **Recurring Reminders**: Auto-create next month's notifications after due date passes
4. **Smart Scheduling**: Skip notifications if bill already paid

## Configuration Reference

### Current Notification Schedules

| Reminder Type   | Notifications          |
| --------------- | ---------------------- |
| `credit_card`   | 7 days, 3 days, day-of |
| `bill`          | 7 days, 1 day          |
| `budget_review` | Day-of only            |

### Modifying Schedules

To change when notifications are sent, edit `src/lib/notificationSchedules.ts`:

```typescript
export const NOTIFICATION_SCHEDULES = {
    credit_card: [
        { days_before: 14, label: '2 weeks before' }, // ← Add this
        { days_before: 7, label: '1 week before' },
        { days_before: 3, label: '3 days before' },
        { days_before: 1, label: '1 day before' }, // ← Add this
        { days_before: 0, label: 'Day of' },
    ],
};
```

Changes take effect immediately for new reminders (no migration needed).

## Troubleshooting

See `TESTING_MULTIPLE_NOTIFICATIONS.md` for detailed troubleshooting steps.

### Common Issues

1. **No notifications created**: Check migration was applied
2. **Wrong number of notifications**: Verify config in `notificationSchedules.ts`
3. **Timing is off**: Database stores times in UTC, check timezone settings

## Code Quality

- ✅ No linter errors
- ✅ TypeScript type-safe
- ✅ Backward compatible
- ✅ Well-documented
- ✅ Includes tests
- ✅ Self-contained changes
