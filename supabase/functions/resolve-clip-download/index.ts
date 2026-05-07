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

    const { assetId: rawAssetId, playbackId } = await req.json();
    let assetId: string | null = rawAssetId ?? null;
    if (!assetId && !playbackId) {
      return jsonResponse({ error: "assetId or playbackId is required" }, 400);
    }

    const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
    if (!LIVEPEER_API_KEY) {
      return jsonResponse({ error: "Livepeer API key not configured" }, 500);
    }

    // If only a playbackId was provided, look up the asset id first.
    if (!assetId && playbackId) {
      const lookup = await fetch(`https://livepeer.studio/api/asset?playbackId=${playbackId}`, {
        headers: {
          Authorization: `Bearer ${LIVEPEER_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (lookup.ok) {
        const list = await lookup.json();
        const match = Array.isArray(list) ? list[0] : list;
        assetId = match?.id ?? null;
      }
      if (!assetId) {
        return jsonResponse({ error: "Could not resolve asset for playbackId", playbackId }, 404);
      }
    }

    const assetResponse = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: {
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!assetResponse.ok) {
      const details = await assetResponse.text();
      return jsonResponse({ error: "Failed to resolve clip asset", details }, 500);
    }

    const asset = await assetResponse.json();
    const phase = asset.status?.phase ?? null;
    const playbackUrl = asset.playbackUrl ?? null;
    const downloadUrl = asset.downloadUrl ?? null;

    // When Livepeer reports the asset is ready, promote ALL clip rows that
    // share this asset id to status="ready" with the real playback URL.
    // (parent + sibling formats are inserted as a group by generate-clip.)
    if (phase === "ready" && playbackUrl) {
      await supabase
        .from("generated_clips")
        .update({
          status: "ready",
          source_video_url: playbackUrl,
          download_url: downloadUrl,
        })
        .eq("livepeer_asset_id", assetId)
        .in("status", ["processing", "queued"]);
    }

    if (!downloadUrl) {
      return jsonResponse({
        ok: false,
        error: "Clip is still processing",
        retryable: true,
        phase,
        playbackUrl,
      });
    }

    return jsonResponse({
      ok: true,
      success: true,
      downloadUrl,
      playbackUrl,
      phase,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});