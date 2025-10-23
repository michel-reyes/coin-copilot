import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  sendExpoPushNotifications,
  buildPushMessage,
  isInvalidTokenError,
  getTicketErrorMessage,
  type ExpoPushMessage,
} from '../_shared/expo-push-client.ts';
import {
  calculatePendingNotifications,
  formatNotificationMessage,
  type Event,
  type NotificationSchedule,
} from '../_shared/notification-calculator.ts';

interface NotificationResult {
  total_pending: number;
  successfully_sent: number;
  failed: number;
  invalid_tokens: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Starting scheduled notification processor...');

  try {
    // Verify environment variables are set
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

    // Define processing window: Last 24 hours (to catch missed notifications) to next hour
    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour from now

    console.log(`Processing window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);

    // Fetch all active events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_active', true);

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('No active events found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active events to process',
          result: {
            total_pending: 0,
            successfully_sent: 0,
            failed: 0,
            invalid_tokens: 0,
            errors: [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${events.length} active events`);

    // Fetch all active notification schedules
    const eventIds = events.map((e) => e.id);
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('event_notification_schedules')
      .select('*')
      .in('event_id', eventIds)
      .eq('is_active', true);

    if (schedulesError) {
      throw new Error(`Error fetching schedules: ${schedulesError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      console.log('No active notification schedules found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active notification schedules',
          result: {
            total_pending: 0,
            successfully_sent: 0,
            failed: 0,
            invalid_tokens: 0,
            errors: [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${schedules.length} active notification schedules`);

    // Calculate which notifications should be sent in this window
    const pendingNotifications = calculatePendingNotifications(
      events as Event[],
      schedules as NotificationSchedule[],
      windowStart,
      windowEnd
    );

    if (pendingNotifications.length === 0) {
      console.log('No notifications due in this window');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No notifications due in this window',
          result: {
            total_pending: 0,
            successfully_sent: 0,
            failed: 0,
            invalid_tokens: 0,
            errors: [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${pendingNotifications.length} notifications to send`);

    // Check for duplicates in notification_queue
    const uniqueNotifications = await filterDuplicateNotifications(
      supabaseAdmin,
      pendingNotifications
    );

    console.log(`${uniqueNotifications.length} notifications after deduplication`);

    if (uniqueNotifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All notifications were already sent',
          result: {
            total_pending: pendingNotifications.length,
            successfully_sent: 0,
            failed: 0,
            invalid_tokens: 0,
            errors: [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user push tokens
    const userIds = [...new Set(uniqueNotifications.map((n) => n.event.user_id))];
    const { data: userTokens, error: tokensError } = await supabaseAdmin
      .from('user_api_keys')
      .select('user_id, expo_push_token')
      .in('user_id', userIds)
      .not('expo_push_token', 'is', null);

    if (tokensError) {
      throw new Error(`Error fetching user tokens: ${tokensError.message}`);
    }

    // Create a map of user_id -> expo_push_token
    const tokenMap = new Map(
      userTokens?.map((ut) => [ut.user_id, ut.expo_push_token]) || []
    );

    console.log(`Found ${tokenMap.size} users with push tokens`);

    // Build push messages
    const pushMessages: Array<{
      message: ExpoPushMessage;
      notification: typeof uniqueNotifications[0];
    }> = [];

    for (const notification of uniqueNotifications) {
      const pushToken = tokenMap.get(notification.event.user_id);
      if (!pushToken) {
        console.log(`No push token for user ${notification.event.user_id}, skipping`);
        continue;
      }

      const { title, body } = formatNotificationMessage(
        notification.event,
        notification.schedule,
        notification.target_date
      );

      const message = buildPushMessage(pushToken, title, body, {
        event_id: notification.event.id,
        schedule_id: notification.schedule.id,
        target_date: notification.target_date.toISOString(),
      });

      pushMessages.push({ message, notification });
    }

    console.log(`Prepared ${pushMessages.length} push messages`);

    // Send notifications via Expo Push API
    const tickets = await sendExpoPushNotifications(
      pushMessages.map((pm) => pm.message)
    );

    // Process results and log to notification_queue
    const result: NotificationResult = {
      total_pending: pendingNotifications.length,
      successfully_sent: 0,
      failed: 0,
      invalid_tokens: 0,
      errors: [],
    };

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const { notification } = pushMessages[i];

      const queueEntry = {
        user_id: notification.event.user_id,
        event_id: notification.event.id,
        scheduled_for: notification.notification_datetime.toISOString(),
        sent_at: new Date().toISOString(),
        status: ticket.status === 'ok' ? 'sent' : 'failed',
        error_message: getTicketErrorMessage(ticket),
        expo_receipt_id: ticket.id || null,
      };

      // Insert into notification_queue
      await supabaseAdmin.from('notification_queue').insert(queueEntry);

      // Update result counters
      if (ticket.status === 'ok') {
        result.successfully_sent++;
      } else {
        result.failed++;

        if (isInvalidTokenError(ticket)) {
          result.invalid_tokens++;

          // Clear invalid token from database
          await supabaseAdmin
            .from('user_api_keys')
            .update({ expo_push_token: null, expo_push_token_updated_at: null })
            .eq('user_id', notification.event.user_id);

          console.log(`Cleared invalid push token for user ${notification.event.user_id}`);
        }

        const errorMsg = getTicketErrorMessage(ticket) || 'Unknown error';
        result.errors.push(
          `Event ${notification.event.title} (${notification.event.id}): ${errorMsg}`
        );
      }
    }

    console.log('Notification processing complete:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications processed',
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Fatal error in notification processor:', error);
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

/**
 * Filter out notifications that have already been sent today
 */
async function filterDuplicateNotifications(
  supabase: any,
  notifications: ReturnType<typeof calculatePendingNotifications>
): Promise<typeof notifications> {
  const unique: typeof notifications = [];

  for (const notification of notifications) {
    // Check if we already have a sent/pending notification for this event today
    const scheduledDate = new Date(notification.notification_datetime);
    const dateStr = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: existing } = await supabase
      .from('notification_queue')
      .select('id')
      .eq('user_id', notification.event.user_id)
      .eq('event_id', notification.event.id)
      .gte('scheduled_for', `${dateStr}T00:00:00Z`)
      .lt('scheduled_for', `${dateStr}T23:59:59Z`)
      .in('status', ['sent', 'pending'])
      .limit(1);

    if (!existing || existing.length === 0) {
      unique.push(notification);
    } else {
      console.log(
        `Skipping duplicate notification for event ${notification.event.id} on ${dateStr}`
      );
    }
  }

  return unique;
}
