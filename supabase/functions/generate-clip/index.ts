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

function toUnixMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function secondsLabel(value: number): string {
  const safe = Math.max(0, Math.floor(value));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

async function promoteClipWhenReady(supabase: ReturnType<typeof createClient>, assetId: string, apiKey: string) {
  for (const delay of [8_000, 15_000, 25_000, 40_000]) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const assetResponse = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!assetResponse.ok) continue;
    const asset = await assetResponse.json();
    const phase = asset.status?.phase ?? null;
    const playbackUrl = asset.playbackUrl ?? null;
    if (phase === "ready" && playbackUrl) {
      await supabase
        .from("generated_clips")
        .update({ status: "ready", source_video_url: playbackUrl, download_url: asset.downloadUrl ?? playbackUrl })
        .eq("livepeer_asset_id", assetId)
        .in("status", ["processing", "queued"]);
      return;
    }
    if (phase === "failed") {
      await supabase
        .from("generated_clips")
        .update({ status: "failed", error_message: "Livepeer clip rendering failed" })
        .eq("livepeer_asset_id", assetId)
        .in("status", ["processing", "queued"]);
      return;
    }
  }
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

    const body = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isInternalServiceCall = authHeader === `Bearer ${SERVICE_KEY}`;

    const supabase = isInternalServiceCall
      ? createClient(SUPABASE_URL, SERVICE_KEY)
      : createClient(
          SUPABASE_URL,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );

    const {
      playbackId,
      momentTimestampSeconds,
      momentType,
      winnerName,
      momentId,
      clipDuration = 30,
      // New optional params (back-compat: existing callers omit these)
      award_category_id = null,
      template_id = null,
      apply_branding = false,
      recipient_name = null,
      start_offset_seconds = null,
      end_offset_seconds = null,
      user_id = null,
    } = body;

    let userId = user_id as string | null;
    if (!isInternalServiceCall) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      userId = user.id;
    }

    if (!userId) {
      return jsonResponse({ error: "user_id is required for internal clip generation" }, 400);
    }

    if (!playbackId) {
      return jsonResponse({ error: "playbackId is required" }, 400);
    }

    const LIVEPEER_API_KEY = Deno.env.get("LIVEPEER_API_KEY");
    if (!LIVEPEER_API_KEY) {
      return jsonResponse({ error: "Livepeer API key not configured" }, 500);
    }

    // Window: explicit offsets win, else center on moment with clipDuration.
    // Livepeer's clip API expects UNIX milliseconds, not seconds from stream start.
    let startOffsetSec: number;
    let endOffsetSec: number;
    if (start_offset_seconds !== null && end_offset_seconds !== null) {
      startOffsetSec = Math.max(0, (momentTimestampSeconds || 0) + Number(start_offset_seconds));
      endOffsetSec = Math.max(startOffsetSec + 1, (momentTimestampSeconds || 0) + Number(end_offset_seconds));
    } else {
      const halfDuration = Math.floor(clipDuration / 2);
      startOffsetSec = Math.max(0, (momentTimestampSeconds || 0) - halfDuration);
      endOffsetSec = Math.max(startOffsetSec + 1, (momentTimestampSeconds || 0) + halfDuration);
    }

    const roomId = body.stream_room_id ?? body.streamRoomId ?? null;
    let streamStartedAtMs: number | null = toUnixMs(body.stream_started_at ?? body.streamStartedAt);
    let roomStatus: string | null = null;

    if (roomId) {
      const { data: room } = await supabase
        .from("stream_rooms")
        .select("started_at, status")
        .eq("id", roomId)
        .maybeSingle();
      if (room) {
        roomStatus = (room as any).status ?? null;
        // Always trust the DB started_at over a possibly-stale client value.
        const dbStartedAt = toUnixMs((room as any).started_at);
        if (dbStartedAt) streamStartedAtMs = dbStartedAt;
      }
    }

    if (!streamStartedAtMs && award_category_id) {
      const { data: catRoom } = await supabase
        .from("award_categories")
        .select("event_id")
        .eq("id", award_category_id)
        .maybeSingle();
      if (catRoom?.event_id) {
        const { data: room } = await supabase
          .from("stream_rooms")
          .select("started_at, status")
          .eq("id", catRoom.event_id)
          .maybeSingle();
        streamStartedAtMs = toUnixMs((room as any)?.started_at);
        roomStatus = roomStatus || (room as any)?.status || null;
      }
    }

    if (!streamStartedAtMs) {
      return jsonResponse({ error: "Stream is not active. Press Start Monitoring before generating a clip." }, 400);
    }

    // Block clip generation when no stream is actually live/monitoring.
    if (roomStatus && !["live", "monitoring"].includes(roomStatus)) {
      return jsonResponse({ error: `Stream is ${roomStatus}. Start Monitoring on a live stream before generating clips.` }, 400);
    }

    // If the stream just started, wait briefly so Livepeer has at least ~6s of footage.
    let now = Date.now();
    let elapsedSec = Math.max(0, Math.floor((now - streamStartedAtMs) / 1000));
    if (elapsedSec < 6) {
      const waitMs = (6 - elapsedSec) * 1000 + 500;
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 8000)));
      now = Date.now();
      elapsedSec = Math.max(0, Math.floor((now - streamStartedAtMs) / 1000));
    }

    // Clamp start offset so we never request a window before the stream began.
    const safeStartOffsetSec = Math.max(0, Math.min(startOffsetSec, Math.max(0, elapsedSec - 1)));
    const startTime = streamStartedAtMs + safeStartOffsetSec * 1000;
    const cappedEndOffsetSec = Math.min(endOffsetSec, elapsedSec);
    const endTime = streamStartedAtMs + cappedEndOffsetSec * 1000;

    if (endTime <= startTime) {
      return jsonResponse({ error: "Clip window is empty. Wait a few seconds after the moment, then try again." }, 400);
    }
    if (endTime > now + 5000) {
      return jsonResponse({ error: "Clip end is in the future. Wait a few seconds after the winner moment, then try again." }, 400);
    }

    const ensureMomentId = async (): Promise<string | null> => {
      if (momentId) return momentId;
      const { data: inserted, error: momentErr } = await supabase
        .from("detected_moments")
        .insert({
          user_id: userId,
          stream_room_id: roomId,
          timestamp: secondsLabel(momentTimestampSeconds || startOffsetSec),
          timestamp_seconds: momentTimestampSeconds || startOffsetSec,
          moment_type: momentType || "Manual Trigger",
          winner_name: winnerName || recipient_name || null,
          award_name: momentType || null,
          matched_award_category_id: award_category_id,
          matched_phrase: momentType || "Manual trigger",
          status: "confirmed",
          confidence: 1,
          confidence_score: 100,
          clip_start: Math.round(startOffsetSec),
          clip_end: Math.round(cappedEndOffsetSec),
        })
        .select("id")
        .single();

      if (momentErr) console.error("detected_moment insert failed", momentErr.message);
      return inserted?.id ?? null;
    };

    const resolvedMomentId = await ensureMomentId();

    const clipResponse = await fetch("https://livepeer.studio/api/clip", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playbackId,
        startTime,
        endTime,
        name: `${momentType || "Moment"} - ${winnerName || "Clip"}`,
      }),
    });

    if (!clipResponse.ok) {
      const details = await clipResponse.text();
      const totalSec = Math.max(1, Math.round((endTime - startTime) / 1000));
      await supabase.from("generated_clips").insert([
        {
          user_id: userId,
          moment_id: resolvedMomentId,
          winner_name: winnerName || recipient_name || "Clip failed",
          category: momentType || "Award",
          format: "horizontal",
          dimensions: "1920×1080",
          format_label: "16:9 (YouTube/LinkedIn)",
          status: "failed",
          duration_label: `${totalSec}s`,
          source_video_url: null,
          award_category_id,
          start_offset_seconds: Math.round(startOffsetSec),
          end_offset_seconds: Math.round(cappedEndOffsetSec),
          error_message: details || "Livepeer clip creation failed",
        } as any,
      ]);
      return jsonResponse({ error: "Failed to create clip via Livepeer", details }, 500);
    }

    const clipData = await clipResponse.json();
    const clipAssetId = clipData.asset?.id ?? null;
    const clipPlaybackId = clipData.asset?.playbackId ?? clipData.playbackId ?? null;

    if (!clipAssetId) {
      return jsonResponse({ error: "Livepeer did not return a clip asset id" }, 500);
    }

    // We deliberately do NOT save an HLS index URL here. The asset is still
    // being rendered by Livepeer at this moment, and writing a URL that points
    // to an unfinished asset is exactly what produces the "empty video" the
    // user has been seeing. We save NULL for source_video_url, mark status as
    // "processing", and let resolve-clip-download (or a manual refresh) flip
    // the row to "ready" once Livepeer reports the asset's playback URL.
    const savedClipUrl: string | null = null;

    // Resolve recipient + category name from award_categories if linked.
    let recipientEmail: string | null = null;
    let recipientPhone: string | null = null;
    let resolvedRecipientName: string | null = recipient_name;
    let resolvedEventId: string | null = null;
    let resolvedCategoryName: string | null = null;

    if (award_category_id) {
      const { data: cat } = await supabase
        .from("award_categories")
        .select("recipient_name, recipient_email, recipient_phone, event_id, name")
        .eq("id", award_category_id)
        .maybeSingle();
      if (cat) {
        resolvedRecipientName = resolvedRecipientName || cat.recipient_name;
        recipientEmail = cat.recipient_email;
        recipientPhone = cat.recipient_phone;
        resolvedEventId = cat.event_id;
        resolvedCategoryName = cat.name;
      }
    }

    // Honest labels — never write "AI did not capture..." into the row.
    // Linked → "{recipient} — {category}". Untagged → "Manual clip at mm:ss".
    const totalSec = Math.max(1, Math.round((endTime - startTime) / 1000));
    const mm = Math.floor(startOffsetSec / 60);
    const ss = Math.floor(startOffsetSec % 60).toString().padStart(2, "0");
    const finalWinnerName = award_category_id
      ? (resolvedRecipientName || winnerName || "Recipient")
      : (winnerName || `Manual clip at ${mm}:${ss}`);
    const finalCategoryName = award_category_id
      ? (resolvedCategoryName || momentType || "Award")
      : (momentType || "Untagged");

    const formats = [
      { format: "horizontal", dimensions: "1920×1080", format_label: "16:9 (YouTube/LinkedIn)", duration_label: `${totalSec}s` },
      { format: "square",     dimensions: "1080×1080", format_label: "1:1 (Feed)",                duration_label: `${totalSec}s` },
      { format: "vertical",   dimensions: "1080×1920", format_label: "9:16 (Stories/Reels)",      duration_label: `${Math.max(15, Math.round(totalSec * 0.5))}s` },
    ];

    // Insert parent (horizontal) first, then siblings linked via parent_clip_id
    const baseRow = {
      user_id: userId,
      moment_id: resolvedMomentId,
      winner_name: finalWinnerName,
      category: finalCategoryName,
      // Honest status: the Livepeer asset still needs to render. The UI
      // disables Download/Preview while processing and the resolver flips
      // this to "ready" once Livepeer returns a real playback URL.
      status: "processing",
      source_video_url: savedClipUrl,
      award_category_id: award_category_id,
      event_id: resolvedEventId,
      template_id: template_id,
      recipient_name: resolvedRecipientName,
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      branding_applied: apply_branding === true,
      livepeer_asset_id: clipAssetId,
      livepeer_playback_id: clipPlaybackId,
      start_offset_seconds: Math.round(startOffsetSec),
      end_offset_seconds: Math.round(cappedEndOffsetSec),
      trigger_timestamp: momentTimestampSeconds != null ? new Date(Date.now()).toISOString() : null,
    };

    const { data: parent, error: parentErr } = await supabase
      .from("generated_clips")
      .insert({ ...baseRow, ...formats[0] })
      .select()
      .single();

    if (parentErr || !parent) {
      return jsonResponse({ error: "Failed to save parent clip", details: parentErr?.message }, 500);
    }

    const siblingInserts = formats.slice(1).map(fmt => ({ ...baseRow, ...fmt, parent_clip_id: parent.id }));
    const { data: siblings, error: sibErr } = await supabase
      .from("generated_clips").insert(siblingInserts).select();

    if (sibErr) {
      return jsonResponse({ error: "Saved parent but failed sibling formats", details: sibErr.message }, 500);
    }

    (globalThis as any).EdgeRuntime?.waitUntil?.(
      promoteClipWhenReady(supabase, clipAssetId, LIVEPEER_API_KEY).catch((err) => {
        console.error("clip promotion failed", err);
      })
    );

    return jsonResponse({
      success: true,
      clipData,
      clips: [parent, ...(siblings ?? [])],
      playbackUrl: null,
      assetId: clipAssetId,
      savedClipUrl,
      processing: true,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});
