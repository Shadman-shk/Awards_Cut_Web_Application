// detect-winner: LLM-driven winner detection.
// Reads the most recent transcripts for a stream room, gives them to an LLM
// (via Lovable AI Gateway) along with the awards list, and asks it to extract
// any award announcements with a confidence score.
//
// On confidence >= autoFireThreshold (default 0.8) → auto-fires generate-clip
// and stamps award_categories.triggered_at.
// On confidence between 0.5 and threshold → inserts a `detected_moments` row
// with status='pending_review' for the operator to confirm in the UI.
// Below 0.5 → ignored.
//
// Invoked by cron-transcribe-tick after each transcript fetch, or manually
// with { roomId, autoFireThreshold? }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const DEFAULT_BEFORE = 15;
const DEFAULT_AFTER = 45;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const roomId: string | undefined = body.roomId;
    const autoFireThreshold: number = typeof body.autoFireThreshold === "number"
      ? body.autoFireThreshold : 0.8;
    const lookbackChunks: number = typeof body.lookbackChunks === "number"
      ? body.lookbackChunks : 3;

    if (!roomId) return json({ error: "roomId required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load room
    const { data: room } = await admin
      .from("stream_rooms")
      .select("id, user_id, status, livepeer_playback_id, template_id, started_at")
      .eq("id", roomId)
      .maybeSingle();
    if (!room) return json({ error: "Room not found" }, 404);
    if (!["live", "monitoring"].includes(room.status)) return json({ skipped: true, reason: "not live" });

    // Load recent transcripts
    const { data: transcripts } = await admin
      .from("transcripts")
      .select("id, start_seconds, end_seconds, text, words_json")
      .eq("stream_room_id", roomId)
      .order("start_seconds", { ascending: false })
      .limit(lookbackChunks);

    if (!transcripts || transcripts.length === 0) {
      return json({ skipped: true, reason: "no transcripts yet" });
    }

    const ordered = [...transcripts].reverse();
    const transcriptWindow = ordered
      .map((t) => `[${Math.floor(Number(t.start_seconds) || 0)}s] ${t.text}`)
      .join("\n");

    // Awards list (only those not yet triggered, to avoid duplicate detections)
    const { data: cats } = await admin
      .from("award_categories")
      .select("id, name, recipient_name, triggered_at")
      .eq("user_id", room.user_id)
      .is("triggered_at", null);

    if (!cats || cats.length === 0) {
      return json({ skipped: true, reason: "no pending categories" });
    }

    const catList = cats
      .map((c, i) => `${i + 1}. ${c.name}${c.recipient_name ? ` — winner: ${c.recipient_name}` : ""}`)
      .join("\n");

    // LLM tool-call request via Lovable AI Gateway
    const systemPrompt = `You are an award-ceremony moment detector. Given a transcript window from a live awards ceremony and a list of pending award categories, identify any winner ANNOUNCEMENTS happening in the transcript.

Distinguish announcements ("the winner is...", "the award goes to...", "congratulations to...") from nominee read-outs ("nominees include...", "the nominees are..."). Only return announcements.

For each detection, return:
- category_index (1-based index from the provided list)
- winner_name (extracted from transcript or null if same as listed)
- announcement_phrase (the exact short phrase that triggered the match)
- confidence (0.0–1.0)
- timecode_seconds (best-guess seconds offset of the announcement, using the [Ns] markers)

If nothing is being announced, return an empty detections array.`;

    const userPrompt = `PENDING AWARD CATEGORIES:
${catList}

TRANSCRIPT WINDOW (with timecodes in seconds):
${transcriptWindow}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_detections",
            description: "Report detected winner announcements.",
            parameters: {
              type: "object",
              properties: {
                detections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category_index: { type: "number" },
                      winner_name: { type: "string" },
                      announcement_phrase: { type: "string" },
                      confidence: { type: "number" },
                      timecode_seconds: { type: "number" },
                    },
                    required: ["category_index", "announcement_phrase", "confidence", "timecode_seconds"],
                  },
                },
              },
              required: ["detections"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_detections" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "AI rate-limited" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: "AI gateway failed", details: t }, 502);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let detections: Array<{
      category_index: number;
      winner_name?: string;
      announcement_phrase: string;
      confidence: number;
      timecode_seconds: number;
    }> = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        detections = parsed.detections ?? [];
      } catch (e) {
        console.error("tool-call args parse failed", e);
      }
    }

    const autoFired: Array<{ category: string; confidence: number }> = [];
    const pending: Array<{ category: string; confidence: number }> = [];

    for (const d of detections) {
      const cat = cats[d.category_index - 1];
      if (!cat) continue;
      if (d.confidence < 0.5) continue;

      // De-dupe — skip if a detection already exists for this category in last 5 min
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data: dup } = await admin
        .from("detected_moments")
        .select("id")
        .eq("stream_room_id", roomId)
        .eq("matched_award_category_id", cat.id)
        .gte("created_at", fiveMinAgo)
        .maybeSingle();
      if (dup) continue;

      const ts = Math.max(0, Math.floor(d.timecode_seconds || 0));
      const winnerName = d.winner_name?.trim() || cat.recipient_name || cat.name;

      // Insert detected_moment record (pending or auto-confirmed)
      const willAutoFire = d.confidence >= autoFireThreshold;
      const status = willAutoFire ? "auto_confirmed" : "pending_review";

      await admin.from("detected_moments").insert({
        user_id: room.user_id,
        stream_room_id: roomId,
        timestamp: `${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, "0")}`,
        timestamp_seconds: ts,
        moment_type: "Award Announcement",
        matched_phrase: d.announcement_phrase,
        matched_award_category_id: cat.id,
        award_name: cat.name,
        winner_name: winnerName,
        confidence: d.confidence,
        confidence_score: Math.round(d.confidence * 100),
        status,
        clip_start: Math.max(0, ts - DEFAULT_BEFORE),
        clip_end: ts + DEFAULT_AFTER,
      });

      if (willAutoFire) {
        // Fire generate-clip and stamp triggered_at
        try {
          const generateResp = await fetch(`${SUPABASE_URL}/functions/v1/generate-clip`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              playbackId: room.livepeer_playback_id,
              momentTimestampSeconds: ts,
              momentType: cat.name,
              winnerName,
              clipDuration: DEFAULT_BEFORE + DEFAULT_AFTER,
              award_category_id: cat.id,
              stream_room_id: roomId,
              stream_started_at: room.started_at,
              template_id: room.template_id ?? null,
              apply_branding: true,
              recipient_name: cat.recipient_name ?? winnerName,
              start_offset_seconds: -DEFAULT_BEFORE,
              end_offset_seconds: DEFAULT_AFTER,
              user_id: room.user_id,
            }),
          });
          if (!generateResp.ok) {
            console.error("auto-fire generate-clip failed", generateResp.status, await generateResp.text());
            await admin.from("detected_moments").update({ status: "pending_review" }).eq("stream_room_id", roomId).eq("matched_award_category_id", cat.id).eq("status", "auto_confirmed");
            pending.push({ category: cat.name, confidence: d.confidence });
            continue;
          }
        } catch (e) {
          console.error("auto-fire generate-clip failed", e);
          await admin.from("detected_moments").update({ status: "pending_review" }).eq("stream_room_id", roomId).eq("matched_award_category_id", cat.id).eq("status", "auto_confirmed");
          pending.push({ category: cat.name, confidence: d.confidence });
          continue;
        }

        await admin
          .from("award_categories")
          .update({ triggered_at: new Date().toISOString(), status: "clipping" })
          .eq("id", cat.id);

        autoFired.push({ category: cat.name, confidence: d.confidence });
      } else {
        pending.push({ category: cat.name, confidence: d.confidence });
      }
    }

    return json({
      success: true,
      detections_count: detections.length,
      auto_fired: autoFired,
      pending_confirmation: pending,
    });
  } catch (e) {
    console.error("detect-winner error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
