import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Cleanup Events Edge Function
 *
 * Automatically:
 * 1. Deactivates one-time events that have passed their due_date
 * 2. Deletes inactive one-time events and their associated data
 * 3. Deletes old notification history (45-day retention policy)
 *
 * Scheduled to run every hour via pg_cron
 */

interface CleanupResult {
  deactivated_count: number;
  deleted_events_count: number;
  deleted_schedules_count: number;
  deleted_notifications_count: number;
  deleted_old_notifications_count: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Starting event cleanup process...');

  try {
    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    // Create Supabase admin client (service role for full access)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const result: CleanupResult = {
      deactivated_count: 0,
      deleted_events_count: 0,
      deleted_schedules_count: 0,
      deleted_notifications_count: 0,
      deleted_old_notifications_count: 0,
      errors: [],
    };

    // Get current date (YYYY-MM-DD format)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Current date: ${todayStr}`);

    // ========================================
    // STEP 1: Auto-deactivate past one-time events
    // ========================================
    console.log('Step 1: Deactivating past one-time events...');

    const { data: deactivatedEvents, error: deactivateError } = await supabaseAdmin
      .from('events')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('recurrence_type', 'one_time')
      .eq('is_active', true)
      .lt('due_date', todayStr)
      .select('id, title, due_date');

    if (deactivateError) {
      const errorMsg = `Error deactivating events: ${deactivateError.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    } else {
      result.deactivated_count = deactivatedEvents?.length || 0;
      console.log(`Deactivated ${result.deactivated_count} past one-time events`);

      if (deactivatedEvents && deactivatedEvents.length > 0) {
        deactivatedEvents.forEach(event => {
          console.log(`  - Deactivated: "${event.title}" (due: ${event.due_date})`);
        });
      }
    }

    // ========================================
    // STEP 2: Get all inactive one-time events to delete
    // ========================================
    console.log('Step 2: Finding inactive one-time events to delete...');

    const { data: eventsToDelete, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id, title, due_date')
      .eq('recurrence_type', 'one_time')
      .eq('is_active', false);

    if (fetchError) {
      const errorMsg = `Error fetching inactive events: ${fetchError.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    } else if (eventsToDelete && eventsToDelete.length > 0) {
      console.log(`Found ${eventsToDelete.length} inactive one-time events to delete`);

      const eventIdsToDelete = eventsToDelete.map(e => e.id);

      // ========================================
      // STEP 3: Delete notification_queue entries
      // ========================================
      console.log('Step 3: Deleting notification history...');

      const { data: deletedNotifications, error: notificationsError } = await supabaseAdmin
        .from('notification_queue')
        .delete()
        .in('event_id', eventIdsToDelete)
        .select('id');

      if (notificationsError) {
        const errorMsg = `Error deleting notification history: ${notificationsError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      } else {
        result.deleted_notifications_count = deletedNotifications?.length || 0;
        console.log(`Deleted ${result.deleted_notifications_count} notification history entries`);
      }

      // ========================================
      // STEP 4: Delete event_notification_schedules
      // ========================================
      console.log('Step 4: Deleting notification schedules...');

      const { data: deletedSchedules, error: schedulesError } = await supabaseAdmin
        .from('event_notification_schedules')
        .delete()
        .in('event_id', eventIdsToDelete)
        .select('id');

      if (schedulesError) {
        const errorMsg = `Error deleting schedules: ${schedulesError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      } else {
        result.deleted_schedules_count = deletedSchedules?.length || 0;
        console.log(`Deleted ${result.deleted_schedules_count} notification schedules`);
      }

      // ========================================
      // STEP 5: Delete the events themselves
      // ========================================
      console.log('Step 5: Deleting events...');

      const { data: deletedEvents, error: eventsError } = await supabaseAdmin
        .from('events')
        .delete()
        .in('id', eventIdsToDelete)
        .select('id, title');

      if (eventsError) {
        const errorMsg = `Error deleting events: ${eventsError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      } else {
        result.deleted_events_count = deletedEvents?.length || 0;
        console.log(`Deleted ${result.deleted_events_count} events`);

        if (deletedEvents && deletedEvents.length > 0) {
          deletedEvents.forEach(event => {
            console.log(`  - Deleted: "${event.title}"`);
          });
        }
      }
    } else {
      console.log('No inactive one-time events found to delete');
    }

    // ========================================
    // STEP 6: Delete orphaned notification schedules
    // ========================================
    console.log('Step 6: Deleting orphaned notification schedules...');

    // Delete schedules that reference non-existent events
    const { data: orphanedSchedules, error: orphanedError } = await supabaseAdmin
      .rpc('delete_orphaned_schedules');

    if (orphanedError) {
      // If the function doesn't exist, try direct query
      console.log('RPC function not available, using direct query for orphaned schedules...');

      const { data: orphaned, error: directOrphanedError } = await supabaseAdmin
        .from('event_notification_schedules')
        .delete()
        .not('event_id', 'in', `(SELECT id FROM events)`)
        .select('id');

      if (directOrphanedError) {
        const errorMsg = `Error deleting orphaned schedules: ${directOrphanedError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      } else {
        const orphanedCount = orphaned?.length || 0;
        console.log(`Deleted ${orphanedCount} orphaned notification schedules`);
        result.deleted_schedules_count += orphanedCount;
      }
    } else {
      const orphanedCount = orphanedSchedules?.[0]?.count || 0;
      console.log(`Deleted ${orphanedCount} orphaned notification schedules`);
      result.deleted_schedules_count += orphanedCount;
    }

    // ========================================
    // STEP 7: Delete old notifications (45-day retention)
    // ========================================
    console.log('Step 7: Deleting old notification history (45-day retention)...');

    // Calculate cutoff date (45 days ago)
    const retentionDays = 45;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString();

    console.log(`Deleting notifications older than: ${cutoffDateStr} (${retentionDays} days ago)`);

    const { data: oldNotifications, error: oldNotificationsError } = await supabaseAdmin
      .from('notification_queue')
      .delete()
      .lt('created_at', cutoffDateStr)
      .select('id');

    if (oldNotificationsError) {
      const errorMsg = `Error deleting old notifications: ${oldNotificationsError.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    } else {
      result.deleted_old_notifications_count = oldNotifications?.length || 0;
      console.log(`Deleted ${result.deleted_old_notifications_count} old notification history entries`);
    }

    // ========================================
    // Summary
    // ========================================
    console.log('Cleanup process complete:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event cleanup completed',
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Fatal error in cleanup process:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
