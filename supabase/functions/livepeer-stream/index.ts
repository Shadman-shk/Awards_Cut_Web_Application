// Renamed from "mux-stream" — this is a Livepeer wrapper, the "mux" name was a
// historical mistake. This function is a stateless wrapper around the Livepeer
// Studio API used by the screen-capture / RTMP modes (which don't have an
// event_id). For event-bound stream provisioning that persists to the
// stream_rooms table, use `start-stream` instead.
//
// FIX 1 (recording): `record: true` is now set on create + reset_key so
// detected moments can be clipped from the recorded asset.
// FIX 4 (security): JWT verification is now enforced — anonymous Livepeer
// stream creation is no longer allowed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIVEPEER_API_BASE = "https://livepeer.studio/api";

const PROFILES = [
  { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
  { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // FIX 4: Require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
  if (!LIVEPEER_API_KEY) return json({ error: "Livepeer API key not configured" }, 500);

  const authHeaders = {
    Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const { action, stream_id } = await req.json();

    if (action === "create") {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: `ceremony-${Date.now()}`,
          record: true, // FIX 1: enable recording so clips can be generated
          profiles: PROFILES,
        }),
      });

      const data = await res.json();
      if (!res.ok) return json({ error: `Livepeer API error [${res.status}]: ${JSON.stringify(data)}` }, res.status);

      return json({
        stream_id: data.id,
        stream_key: data.streamKey,
        rtmps_url: "rtmp://rtmp.livepeer.com/live",
        rtmp_url: "rtmp://rtmp.livepeer.com/live",
        playback_id: data.playbackId || null,
        status: data.isActive ? "active" : "idle",
      });
    }

    if (action === "status" && stream_id) {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });

      if (res.status === 404) {
        return json({ stream_id, status: "gone", playback_id: null, active_asset_id: null, recent_asset_ids: [] });
      }

      const data = await res.json();
      if (!res.ok) return json({ error: `Livepeer API error [${res.status}]: ${JSON.stringify(data)}` }, res.status);

      return json({
        stream_id: data.id,
        status: data.isActive ? "active" : "idle",
        playback_id: data.playbackId || null,
        active_asset_id: null,
        recent_asset_ids: [],
      });
    }

    if (action === "delete" && stream_id) {
      const res = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });

      if (res.status === 404 || res.status === 410) {
        await res.text();
        return json({ success: true, status: "gone" });
      }

      if (!res.ok) {
        const text = await res.text();
        return json({ error: `Livepeer delete error [${res.status}]: ${text}` }, res.status);
      }
      await res.text();
      return json({ success: true });
    }

    if (action === "reset_key" && stream_id) {
      const getRes = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });
      const currentStream = getRes.ok ? await getRes.json() : { name: `ceremony-${Date.now()}` };
      if (!getRes.ok) await getRes.text();

      const delRes = await fetch(`${LIVEPEER_API_BASE}/stream/${stream_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
      });
      await delRes.text();

      const createRes = await fetch(`${LIVEPEER_API_BASE}/stream`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: currentStream.name || `ceremony-${Date.now()}`,
          record: true, // FIX 1: keep recording enabled after reset
          profiles: PROFILES,
        }),
      });

      const newStream = await createRes.json();
      if (!createRes.ok) return json({ error: `Livepeer reset error: ${JSON.stringify(newStream)}` }, createRes.status);

      return json({
        stream_id: newStream.id,
        stream_key: newStream.streamKey,
        playback_id: newStream.playbackId || null,
      });
    }

    return json({ error: "Invalid action. Use: create, status, delete, reset_key" }, 400);
  } catch (err) {
    console.error("livepeer-stream error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
