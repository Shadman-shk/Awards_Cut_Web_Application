// detect-from-transcript: scans a transcript row for award-announcement
// trigger phrases (generic, per-room category, per-recipient) and inserts
// `detected_moments` rows with status='pending_review' and a precise
// word-level timestamp_seconds from the Whisper word array.
//
// Invoked manually with { transcriptId } or via Supabase database webhook
// posting the new row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GENERIC_PHRASES = [
  "and the winner is",
  "the award goes to",
  "please welcome",
  "congratulations to",
  "the recipient",
  "this year's",
  "winner of",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

function findWordOffset(words: WhisperWord[] | null, phrase: string): number | null {
  if (!words || words.length === 0) return null;
  const tokens = phrase.toLowerCase().split(/\s+/).filter(Boolean);
  for (let i = 0; i <= words.length - tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < tokens.length; j++) {
      const w = (words[i + j].word || "").toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
      if (!w.includes(tokens[j]) && tokens[j] !== w) {
        ok = false;
        break;
      }
    }
    if (ok) return words[i].start;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    // Accept either a direct transcriptId or a Supabase webhook payload { record: { id } }
    const transcriptId: string | undefined = body.transcriptId ?? body.record?.id;
    if (!transcriptId) return json({ error: "transcriptId required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tr, error: trErr } = await admin
      .from("transcripts")
      .select("id, stream_room_id, user_id, start_seconds, end_seconds, text, words_json")
      .eq("id", transcriptId)
      .maybeSingle();
    if (trErr || !tr) return json({ error: "Transcript not found" }, 404);

    const { data: cats } = await admin
      .from("award_categories")
      .select("id, name, recipient_name")
      .eq("user_id", tr.user_id);

    const lowerText = (tr.text || "").toLowerCase();
    const words = (tr.words_json as WhisperWord[] | null) ?? null;
    const inserted: Array<{ phrase: string; confidence: number }> = [];

    const tryInsert = async (
      phrase: string,
      confidence: number,
      categoryId: string | null,
    ) => {
      if (!lowerText.includes(phrase.toLowerCase())) return;
      const wordOffset = findWordOffset(words, phrase);
      const ts = (Number(tr.start_seconds) || 0) + (wordOffset ?? 0);

      // De-dupe: skip if a moment already exists within ±5s for this room
      const { data: existing } = await admin
        .from("detected_moments")
        .select("id")
        .eq("stream_room_id", tr.stream_room_id)
        .gte("timestamp_seconds", ts - 5)
        .lte("timestamp_seconds", ts + 5)
        .maybeSingle();
      if (existing) return;

      const { error } = await admin.from("detected_moments").insert({
        user_id: tr.user_id,
        stream_room_id: tr.stream_room_id,
        timestamp: `${Math.floor(ts / 60)}:${String(Math.floor(ts % 60)).padStart(2, "0")}`,
        timestamp_seconds: ts,
        moment_type: "Award Announcement",
        matched_phrase: phrase,
        matched_award_category_id: categoryId,
        confidence,
        confidence_score: Math.round(confidence * 100),
        status: "pending_review",
        clip_start: Math.max(0, Math.floor(ts) - 15),
        clip_end: Math.floor(ts) + 30,
      });
      if (!error) inserted.push({ phrase, confidence });
      else console.error("moment insert error", error);
    };

    // Recipient names — highest confidence
    for (const c of cats ?? []) {
      if (c.recipient_name && c.recipient_name.trim().length >= 3) {
        await tryInsert(c.recipient_name.trim(), 1.0, c.id);
      }
    }
    // Category names
    for (const c of cats ?? []) {
      if (c.name && c.name.trim().length >= 3) {
        await tryInsert(c.name.trim(), 0.8, c.id);
      }
    }
    // Generic phrases
    for (const p of GENERIC_PHRASES) {
      await tryInsert(p, 0.6, null);
    }

    return json({ success: true, inserted });
  } catch (e) {
    console.error("detect-from-transcript error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
