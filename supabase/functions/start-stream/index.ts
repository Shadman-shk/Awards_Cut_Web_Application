import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIVEPEER_API_BASE = "https://livepeer.studio/api";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const event_id = typeof body?.event_id === "string" ? body.event_id : null;
    if (!event_id) return jsonResponse({ error: "event_id is required" }, 400);

    const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
    if (!LIVEPEER_API_KEY) {
      return jsonResponse({ error: "Livepeer API key not configured" }, 500);
    }

    // Verify event ownership
    const { data: eventRow, error: eventErr } = await supabase
      .from("stream_rooms")
      .select("id, user_id, name, livepeer_stream_id, livepeer_stream_key, livepeer_playback_id, status")
      .eq("id", event_id)
      .maybeSingle();

    if (eventErr) return jsonResponse({ error: eventErr.message }, 500);
    if (!eventRow) return jsonResponse({ error: "Event not found" }, 404);
    if (eventRow.user_id !== user.id) return jsonResponse({ error: "Forbidden" }, 403);

    // If stream already exists, return it
    if (eventRow.livepeer_stream_id && eventRow.livepeer_stream_key) {
      return jsonResponse({
        stream_id: eventRow.livepeer_stream_id,
        stream_key: eventRow.livepeer_stream_key,
        playback_id: eventRow.livepeer_playback_id,
        rtmp_url: "rtmp://rtmp.livepeer.com/live",
        status: eventRow.status,
        existing: true,
      });
    }

    // Create new Livepeer stream
    const res = await fetch(`${LIVEPEER_API_BASE}/stream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: eventRow.name || `event-${event_id.slice(0, 8)}`,
        record: true,
        profiles: [
          { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
          { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return jsonResponse(
        { error: `Livepeer API error [${res.status}]: ${JSON.stringify(data)}` },
        500,
      );
    }

    const updates = {
      livepeer_stream_id: data.id,
      livepeer_stream_key: data.streamKey,
      livepeer_playback_id: data.playbackId || null,
      rtmp_url: "rtmp://rtmp.livepeer.com/live",
      status: "live",
      started_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from("stream_rooms")
      .update(updates)
      .eq("id", event_id);

    if (updErr) return jsonResponse({ error: updErr.message }, 500);

    return jsonResponse({
      stream_id: data.id,
      stream_key: data.streamKey,
      playback_id: data.playbackId || null,
      rtmp_url: "rtmp://rtmp.livepeer.com/live",
      status: "live",
      existing: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
