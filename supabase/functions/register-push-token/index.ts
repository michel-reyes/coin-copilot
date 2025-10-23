import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RegisterPushTokenRequest {
  expo_push_token: string;
  device_info?: {
    platform?: string;
    device_name?: string;
    app_version?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: RegisterPushTokenRequest = await req.json();
    const { expo_push_token, device_info } = body;

    if (!expo_push_token) {
      return new Response(
        JSON.stringify({ error: 'Missing expo_push_token in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token format (basic check)
    const isValidToken =
      expo_push_token.startsWith('ExponentPushToken[') ||
      expo_push_token.startsWith('ExpoPushToken[') ||
      /^[a-zA-Z0-9_-]+$/.test(expo_push_token);

    if (!isValidToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid Expo push token format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update user_api_keys table with push token
    const { data, error } = await supabaseClient
      .from('user_api_keys')
      .update({
        expo_push_token,
        expo_push_token_updated_at: new Date().toISOString(),
        device_info: device_info || null,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating push token:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to register push token',
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Push token registered for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push token registered successfully',
        data: {
          expo_push_token: data.expo_push_token,
          updated_at: data.expo_push_token_updated_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
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
