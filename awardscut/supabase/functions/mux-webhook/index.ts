import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventType = body.type;
    const data = body.data;

    console.log(`Mux webhook received: ${eventType}`, JSON.stringify(data?.id || ''));

    // We can extend this to trigger AI detection when a stream ends,
    // or update stream health metrics in real-time.
    // For now, log events for monitoring.

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // When a live stream becomes active or idle, we could update a streams table
    // For now just acknowledge
    if (eventType === 'video.live_stream.active') {
      console.log(`Stream ${data.id} is now ACTIVE`);
    } else if (eventType === 'video.live_stream.idle') {
      console.log(`Stream ${data.id} is now IDLE`);
    } else if (eventType === 'video.asset.ready') {
      console.log(`Asset ${data.id} is ready for playback`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Mux webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
