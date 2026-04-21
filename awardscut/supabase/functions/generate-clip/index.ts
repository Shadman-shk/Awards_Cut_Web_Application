import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;
    const body = await req.json();
    const { playbackId, momentTimestampSeconds, momentType, winnerName, momentId, clipDuration = 30 } = body;

    if (!playbackId) {
      return jsonResponse({ error: "playbackId is required" }, 400);
    }

    const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
    if (!LIVEPEER_API_KEY) {
      return jsonResponse({ error: "Livepeer API key not configured" }, 500);
    }

    const halfDuration = Math.floor(clipDuration / 2);
    const startTime = Math.max(0, (momentTimestampSeconds || 0) - halfDuration);
    const endTime = (momentTimestampSeconds || 0) + halfDuration;

    const clipResponse = await fetch("https://livepeer.studio/api/clip", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playbackId,
        startTime: startTime * 1000,
        endTime: endTime * 1000,
        name: `${momentType || "Moment"} - ${winnerName || "Clip"}`,
      }),
    });

    if (!clipResponse.ok) {
      const details = await clipResponse.text();
      return jsonResponse({ error: "Failed to create clip via Livepeer", details }, 500);
    }

    const clipData = await clipResponse.json();
    const clipAssetId = clipData.asset?.id ?? null;
    const clipPlaybackId = clipData.asset?.playbackId ?? clipData.playbackId ?? null;
    const clipPlaybackUrl = clipData.playbackUrl
      || (clipPlaybackId ? `https://livepeercdn.studio/hls/${clipPlaybackId}/index.m3u8` : null);

    if (!clipPlaybackUrl) {
      return jsonResponse({ error: "Clip was created but no playback URL was returned" }, 500);
    }

    const savedClipUrl = clipAssetId
      ? `${clipPlaybackUrl}${clipPlaybackUrl.includes("?") ? "&" : "?"}assetId=${clipAssetId}`
      : clipPlaybackUrl;

    const formats = [
      { format: "horizontal", dimensions: "1920×1080", format_label: "16:9 (YouTube/LinkedIn)", duration_label: `${clipDuration}s` },
      { format: "square", dimensions: "1080×1080", format_label: "1:1 (Feed)", duration_label: `${clipDuration}s` },
      { format: "vertical", dimensions: "1080×1920", format_label: "9:16 (Stories/Reels)", duration_label: `${Math.max(15, Math.round(clipDuration * 0.5))}s` },
    ];

    const clipInserts = formats.map((fmt) => ({
      user_id: userId,
      moment_id: momentId || null,
      winner_name: winnerName || "Clip",
      category: momentType || "Moment",
      format: fmt.format,
      dimensions: fmt.dimensions,
      format_label: fmt.format_label,
      status: "ready",
      duration_label: fmt.duration_label,
      source_video_url: savedClipUrl,
    }));

    const { data: insertedClips, error: insertError } = await supabase
      .from("generated_clips")
      .insert(clipInserts)
      .select();

    if (insertError) {
      return jsonResponse({ error: "Clip created but failed to save to database", details: insertError.message }, 500);
    }

    return jsonResponse({
      success: true,
      clipData,
      clips: insertedClips,
      playbackUrl: clipPlaybackUrl,
      assetId: clipAssetId,
      savedClipUrl,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});