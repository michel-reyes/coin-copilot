/**
 * Expo Push Notifications Client
 *
 * Handles sending push notifications via Expo's Push API
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string; // Expo push token
  title?: string;
  body?: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number; // Time to live in seconds
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string; // Receipt ID (for successful sends)
  message?: string; // Error message (for failed sends)
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

/**
 * Send push notifications to Expo's Push API
 * Automatically batches messages (max 100 per request)
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) {
    return [];
  }

  // Expo supports max 100 notifications per request
  const chunks = chunkArray(messages, 100);
  const allTickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Expo Push API error: ${response.status} ${errorText}`);

        // Return error tickets for all messages in this chunk
        const errorTickets: ExpoPushTicket[] = chunk.map(() => ({
          status: 'error',
          message: `API returned ${response.status}: ${errorText}`,
        }));
        allTickets.push(...errorTickets);
        continue;
      }

      const data = await response.json();

      // API returns { data: [tickets] }
      if (data.data && Array.isArray(data.data)) {
        allTickets.push(...data.data);
      } else {
        console.error('Unexpected Expo Push API response format:', data);
        const errorTickets: ExpoPushTicket[] = chunk.map(() => ({
          status: 'error',
          message: 'Unexpected API response format',
        }));
        allTickets.push(...errorTickets);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);

      // Return error tickets for all messages in this chunk
      const errorTickets: ExpoPushTicket[] = chunk.map(() => ({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }));
      allTickets.push(...errorTickets);
    }
  }

  return allTickets;
}

/**
 * Send a single push notification
 */
export async function sendExpoPushNotification(
  message: ExpoPushMessage
): Promise<ExpoPushTicket> {
  const tickets = await sendExpoPushNotifications([message]);
  return tickets[0] || { status: 'error', message: 'No ticket returned' };
}

/**
 * Validate if a token looks like a valid Expo push token
 */
export function isValidExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') ||
         token.startsWith('ExpoPushToken[') ||
         /^[a-zA-Z0-9_-]+$/.test(token); // FCM/APNs token format
}

/**
 * Build a push message with defaults
 */
export function buildPushMessage(
  to: string,
  title: string,
  body: string,
  data?: Record<string, any>
): ExpoPushMessage {
  return {
    to,
    title,
    body,
    data: data || {},
    sound: 'default',
    priority: 'high',
    channelId: 'remindersNotificationChannel', // Match Android channel from app
  };
}

/**
 * Chunk an array into smaller arrays of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Check if a ticket indicates an invalid/expired token
 */
export function isInvalidTokenError(ticket: ExpoPushTicket): boolean {
  return (
    ticket.status === 'error' &&
    ticket.details?.error === 'DeviceNotRegistered'
  );
}

/**
 * Format error message from ticket
 */
export function getTicketErrorMessage(ticket: ExpoPushTicket): string | null {
  if (ticket.status === 'ok') return null;

  if (ticket.details?.error) {
    return `${ticket.details.error}: ${ticket.message || 'Unknown error'}`;
  }

  return ticket.message || 'Unknown error';
}
