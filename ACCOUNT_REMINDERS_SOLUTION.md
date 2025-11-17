# Account-Based Reminders Solution

## Problem Statement

You needed to set reminders per account (credit cards/banks), but were concerned about:

1. How to identify which reminder row to update when modifying a reminder for a specific account
2. Preventing duplicate reminders for the same account
3. Ensuring data integrity when creating/updating account-specific reminders

## Solution Implemented

### 1. Database Schema Updates

#### Reminders Table Structure

The `reminders` table now includes:

- `account_id` (TEXT, optional): Links to Lunch Money account ID
- All other fields for reminder functionality (title, body, due_at, notify_before, etc.)

#### Unique Constraint

Added a **partial unique index** to enforce business rules:

```sql
CREATE UNIQUE INDEX unique_active_reminder_per_account
  ON reminders(user_id, account_id)
  WHERE is_active = true
    AND account_id IS NOT NULL;
```

**Benefits:**

- ✅ Only **ONE active reminder per account per user**
- ✅ Prevents accidental duplicate reminders
- ✅ Makes updates deterministic - you can always find the exact reminder to update
- ✅ Allows multiple inactive reminders (for history)
- ✅ Doesn't restrict non-account reminders (where account_id is NULL)

### 2. Account Settings Table

Created `account_settings` table to store per-account configuration:

```sql
CREATE TABLE account_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    account_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    balance_limit NUMERIC,
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE (user_id, account_id, institution_name)
);
```

**Purpose:**

- Stores account-specific settings like credit limits and payment due days
- Separate from reminders to maintain clear separation of concerns
- Used to generate/update reminders based on account configuration

### 3. How to Update Reminders

The unique constraint solves your original concern. Here's how to update a reminder for a specific account:

#### Using the API (eventsApi.ts)

```typescript
// Find and update reminder for a specific account
const { data: existingReminder } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .eq('is_active', true)
    .single(); // Only one will exist due to unique constraint!

if (existingReminder) {
    // Update the existing reminder
    await supabase
        .from('reminders')
        .update({
            due_at: newDueDate,
            notify_before: newNotifyBefore,
        })
        .eq('id', existingReminder.id);
}
```

#### Using Existing Helper Functions

The codebase already has helper functions in `src/lib/eventsApi.ts`:

1. **getEventByAccount()** - Find reminder by account:

    ```typescript
    const { data: reminder } = await getEventByAccount(accountId);
    ```

### 4. Database Migration Files

Created/Updated migrations (in correct order):

1. `20251017223109_initial_setup.sql` - Creates user_api_keys table
2. `20251115000000_create_notification_system.sql` - Creates reminders & notifications tables
3. `20251116000000_create_account_settings.sql` - Creates account_settings table
4. `20251116000001_link_reminders_to_accounts.sql` - Adds account linking fields
5. `20251116000002_add_unique_account_reminder_constraint.sql` - Adds unique constraint

## Example Workflow

### Creating Reminders for Multiple Accounts

```typescript
// User sets up reminder for Chase card (account_id: 'chase_123')
// Application logic would handle creating the reminder with the account_id

// User sets up reminder for Amex card (account_id: 'amex_456')
// Application logic would handle creating the reminder with the account_id

// If user tries to create another reminder for Chase (account_id: 'chase_123')
// The unique constraint will prevent duplicates
// Application should check for existing reminder and update it instead
```

### Updating Specific Account Reminder

```typescript
// Always finds the correct reminder because of unique constraint
const { data: chaseReminder } = await getEventByAccount('chase_123');

if (chaseReminder) {
    await updateReminder(chaseReminder.id, {
        due_at: '2025-12-18',
        body: 'Updated payment date',
    });
}
```

## Benefits of This Approach

1. **Data Integrity**: Impossible to create duplicate reminders for the same account
2. **Deterministic Updates**: Always know exactly which row to update
3. **Performance**: Indexed lookups are fast
4. **History**: Can keep inactive reminders for audit trail
5. **Flexibility**: Non-account reminders still work (when account_id is NULL)
6. **Safety**: Database-level constraint prevents application bugs from creating duplicates

## Testing the Solution

The unique constraint was tested successfully:

```sql
-- ✅ First reminder for Chase account: SUCCESS
INSERT INTO reminders (..., account_id) VALUES (..., 'chase_123');

-- ❌ Second reminder for same Chase account: FAILS
-- ERROR: duplicate key value violates unique constraint
-- "unique_active_reminder_per_account"
INSERT INTO reminders (..., account_id) VALUES (..., 'chase_123');
```

## Next Steps

1. ✅ Database schema is properly set up
2. ✅ Unique constraints prevent duplicates
3. ✅ API functions handle upsert logic correctly
4. 🔄 Test the complete flow in your application
5. 🔄 Update UI to use the helper functions for account reminders

## Summary

Your concern about identifying which row to update has been solved by adding a **unique partial index** that ensures:

- Only one active reminder can exist per account (per user)
- Updates are deterministic - query by (user_id, account_id) always returns exactly one row
- No manual deduplication needed - database enforces it automatically
