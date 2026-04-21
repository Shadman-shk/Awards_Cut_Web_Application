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

    const { assetId } = await req.json();
    if (!assetId) {
      return jsonResponse({ error: "assetId is required" }, 400);
    }

    const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
    if (!LIVEPEER_API_KEY) {
      return jsonResponse({ error: "Livepeer API key not configured" }, 500);
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
    if (!asset.downloadUrl) {
      return jsonResponse({
        error: "Clip is still processing",
        phase: asset.status?.phase ?? null,
        playbackUrl: asset.playbackUrl ?? null,
      }, 409);
    }

    return jsonResponse({
      success: true,
      downloadUrl: asset.downloadUrl,
      playbackUrl: asset.playbackUrl ?? null,
      phase: asset.status?.phase ?? null,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});