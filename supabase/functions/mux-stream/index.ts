import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LIVEPEER_API_BASE = 'https://livepeer.studio/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LIVEPEER_API_KEY = Deno.env.get('LIVEPEER_API_KEY');

  if (!LIVEPEER_API_KEY) {
    return new Response(JSON.stringify({ error: 'Livepeer API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeaders = {
    Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const { action, stream_id } = await req.json();

    // CREATE a new live stream
    if (action === 'create') {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: `ceremony-${Date.now()}`,
          profiles: [
            { name: '720p', bitrate: 2000000, fps: 30, width: 1280, height: 720 },
            { name: '480p', bitrate: 1000000, fps: 30, width: 854, height: 480 },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Livepeer API error [${res.status}]: ${JSON.stringify(data)}` }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        stream_id: data.id,
        stream_key: data.streamKey,
        rtmps_url: `rtmp://rtmp.livepeer.com/live`,
        rtmp_url: `rtmp://rtmp.livepeer.com/live`,
        playback_id: data.playbackId || null,
        status: data.isActive ? 'active' : 'idle',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET stream status
    if (action === 'status' && stream_id) {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });

      if (res.status === 404) {
        return new Response(JSON.stringify({
          stream_id,
          status: 'gone',
          playback_id: null,
          active_asset_id: null,
          recent_asset_ids: [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Livepeer API error [${res.status}]: ${JSON.stringify(data)}` }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        stream_id: data.id,
        status: data.isActive ? 'active' : 'idle',
        playback_id: data.playbackId || null,
        active_asset_id: null,
        recent_asset_ids: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE a live stream
    if (action === 'delete' && stream_id) {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });

      // 404/410 means already gone — treat as success
      if (res.status === 404 || res.status === 410) {
        await res.text();
        return new Response(JSON.stringify({ success: true, status: 'gone' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!res.ok) {
        const text = await res.text();
        return new Response(JSON.stringify({ error: `Livepeer delete error [${res.status}]: ${text}` }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await res.text();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RESET stream key (Livepeer doesn't support this directly — recreate)
    if (action === 'reset_key' && stream_id) {
      // Get current stream info (may be gone)
      const getRes = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });
      const currentStream = getRes.ok ? await getRes.json() : { name: `ceremony-${Date.now()}` };
      if (!getRes.ok) await getRes.text();

      // Delete old stream
      const delRes = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });
      await delRes.text();

      // Create new stream
      const createRes = await fetch(`${LIVEPEER_API_BASE}/stream`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: currentStream.name || `ceremony-${Date.now()}`,
          profiles: [
            { name: '720p', bitrate: 2000000, fps: 30, width: 1280, height: 720 },
            { name: '480p', bitrate: 1000000, fps: 30, width: 854, height: 480 },
          ],
        }),
      });

      const newStream = await createRes.json();
      if (!createRes.ok) {
        return new Response(JSON.stringify({ error: `Livepeer reset error: ${JSON.stringify(newStream)}` }), {
          status: createRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        stream_id: newStream.id,
        stream_key: newStream.streamKey,
        playback_id: newStream.playbackId || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: create, status, delete, reset_key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Livepeer stream error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
