# Supabase Database Setup Instructions

This guide will help you set up the Supabase database for Coin Copilot using migrations.

## Prerequisites

1. You have a Supabase project created at https://supabase.com/dashboard
2. You have the following environment variables in `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Setup Steps

### Step 1: Login to Supabase CLI

```bash
npx supabase login
```

This will open a browser window for authentication. Follow the prompts to authorize the CLI.

### Step 2: Extract Your Project ID

Your Project ID is the part before `.supabase.co` in your Supabase URL.

**Example:**
- If your URL is: `https://abcdefghijklmnop.supabase.co`
- Your Project ID is: `abcdefghijklmnop`

### Step 3: Link Your Local Project to Remote

```bash
npm run db:link
```

When prompted, enter your Project ID from Step 2.

**Alternative command:**
```bash
npx supabase link --project-ref YOUR_PROJECT_ID
```

You may be asked for your database password. You can find it in:
- Supabase Dashboard → Settings → Database → Database Password

### Step 4: Configure Supabase Auth Settings

Before pushing migrations, configure your Supabase Auth settings:

1. Go to Supabase Dashboard → Authentication → Providers → Email
2. **IMPORTANT**: Turn OFF "Confirm email"
   - This is required because we're using hidden emails for authentication
3. Save changes

### Step 5: Push Migrations to Remote Database

```bash
npm run db:push
```

This will apply the migration in `supabase/migrations/20251017223109_initial_setup.sql` to your remote database.

**What this migration does:**
- Creates `user_api_keys` table
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Adds auto-update trigger for `updated_at` column

### Step 6: Verify Migration

You can verify the migration was successful by:

1. **Check migration status:**
   ```bash
   npm run db:status
   ```

2. **View in Supabase Dashboard:**
   - Go to Supabase Dashboard → Table Editor
   - You should see the `user_api_keys` table

3. **Test in SQL Editor:**
   ```sql
   SELECT * FROM user_api_keys;
   ```

## Troubleshooting

### "Project not linked"
- Run `npm run db:link` again
- Make sure you entered the correct Project ID

### "Password required"
- Check Supabase Dashboard → Settings → Database
- You may need to reset your database password

### "Migration already applied"
- This is safe to ignore - it means the migration ran successfully before
- Use `npm run db:status` to check which migrations have been applied

### "Permission denied"
- Make sure you're logged in: `npx supabase login`
- Verify you have access to the project in the Supabase Dashboard

## Next Steps

After successfully pushing the migration:

1. **Disable email confirmation** (if not done in Step 4)
2. **Test the app:**
   ```bash
   npm start
   ```
3. Try signing in with a Lunch Money API key

## Available Database Commands

```bash
npm run db:push      # Push migrations to remote database
npm run db:link      # Link local project to remote
npm run db:status    # List migration status
```

## Security Notes

- The `user_api_keys` table has Row Level Security (RLS) enabled
- Users can only access their own API key records
- API keys are stored encrypted in Supabase
- Never commit your `.env.local` file to version control
