// Transcribe-stream: pulls a 30s audio chunk from the Livepeer HLS playlist
// for a stream room and transcribes it via OpenAI Whisper.
// Inserts a row into `transcripts`. Self-reschedules every 30s while the room is live.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { roomId } = await req.json();
    if (!roomId) return json({ error: "roomId required" }, 400);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load the room
    const { data: room, error: roomErr } = await admin
      .from("stream_rooms")
      .select("id, user_id, status, livepeer_playback_id, started_at")
      .eq("id", roomId)
      .maybeSingle();

    if (roomErr || !room) return json({ error: "Room not found" }, 404);
    if (!["live", "monitoring"].includes(room.status) || !room.livepeer_playback_id) {
      return json({ skipped: true, reason: "Room not live" }, 200);
    }

    // 60s grace period — Livepeer needs time to ingest first frames and
    // produce HLS segments. Hitting the playlist URL too early returns
    // "Stream open failed" / ENDLIST.
    if (room.started_at) {
      const ageMs = Date.now() - new Date(room.started_at).getTime();
      if (ageMs < 60_000) {
        return json({ skipped: true, reason: "Grace period (stream <60s old)", ageMs }, 200);
      }
    }

    // Fetch the live HLS master playlist
    const playlistUrl = `https://livepeercdn.studio/hls/${room.livepeer_playback_id}/index.m3u8`;
    const masterResp = await fetch(playlistUrl);
    if (!masterResp.ok) {
      console.warn("HLS master not ready", masterResp.status);
      return json({ skipped: true, reason: "HLS master not ready", status: masterResp.status }, 200);
    }
    const masterText = await masterResp.text();

    // If Livepeer signals stream open failure or ended, skip this tick.
    if (masterText.includes("#EXT-X-ERROR") || masterText.includes("#EXT-X-ENDLIST")) {
      console.warn("Livepeer playlist not ready (error/endlist):", masterText.slice(0, 200));
      return json({ skipped: true, reason: "Playlist not ready (error/endlist)" }, 200);
    }

    // Parse master playlist — find a variant (.m3u8) URI line. The master may use
    // either absolute URLs or relative paths, and lines may have \r endings or query strings.
    const masterLines = masterText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let variantLine: string | undefined;
    let isMaster = false;
    for (const l of masterLines) {
      if (l.startsWith("#")) {
        if (l.startsWith("#EXT-X-STREAM-INF")) isMaster = true;
        continue;
      }
      if (l.includes(".m3u8")) {
        variantLine = l;
        break;
      }
    }

    // If this playlist is already a media playlist (has segments, no variants), use it directly.
    let variantText: string;
    let variantUrl: string;
    if (variantLine) {
      variantUrl = new URL(variantLine, playlistUrl).toString();
      const variantResp = await fetch(variantUrl);
      if (!variantResp.ok) {
        console.warn("Variant playlist not ready", variantResp.status);
        return json({ skipped: true, reason: "Variant playlist not ready", status: variantResp.status }, 200);
      }
      variantText = await variantResp.text();
    } else if (!isMaster && masterText.includes("#EXTINF")) {
      // It's actually a media playlist already
      variantUrl = playlistUrl;
      variantText = masterText;
    } else {
      console.warn("No variant playlist yet:", masterText.slice(0, 200));
      return json({ skipped: true, reason: "No variant playlist yet" }, 200);
    }

    const segLines = variantText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    if (segLines.length === 0) {
      return json({ skipped: true, reason: "No segments yet" }, 200);
    }

    // Take the most recent ~30s of segments
    const lastSegs = segLines.slice(-5);
    const segBlobs: Uint8Array[] = [];
    for (const seg of lastSegs) {
      const segUrl = new URL(seg, variantUrl).toString();
      const r = await fetch(segUrl);
      if (r.ok) segBlobs.push(new Uint8Array(await r.arrayBuffer()));
    }
    if (segBlobs.length === 0) {
      return json({ skipped: true, reason: "Could not fetch segments yet" }, 200);
    }

    // Concatenate TS segments into one buffer (Whisper accepts ts/mpeg)
    const totalLen = segBlobs.reduce((a, b) => a + b.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of segBlobs) {
      merged.set(b, offset);
      offset += b.length;
    }

    // Compute approximate timing — use room created_at + segment count from beginning
    // Simpler: store the wall-clock-relative offset since this transcribe run.
    // We capture stream-relative seconds using the count of historical transcripts * 30.
    const { count: priorCount } = await admin
      .from("transcripts")
      .select("id", { count: "exact", head: true })
      .eq("stream_room_id", roomId);

    const startSeconds = (priorCount ?? 0) * 30;
    const endSeconds = startSeconds + 30;

    // Send to Whisper
    const form = new FormData();
    form.append("file", new Blob([merged], { type: "video/mp2t" }), "chunk.ts");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");

    const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    if (!whisperResp.ok) {
      const t = await whisperResp.text();
      console.error("Whisper error", whisperResp.status, t);
      return json({ error: "Whisper failed", status: whisperResp.status, details: t }, 502);
    }

    const whisperData = await whisperResp.json();
    const text: string = whisperData.text ?? "";
    const words = whisperData.words ?? null;

    if (text.trim().length > 0) {
      const { error: insErr } = await admin.from("transcripts").insert({
        stream_room_id: roomId,
        user_id: room.user_id,
        start_seconds: startSeconds,
        end_seconds: endSeconds,
        text,
        words_json: words,
      });
      if (insErr) console.error("transcript insert error", insErr);
    }

    return json({ success: true, text, startSeconds, endSeconds });
  } catch (e) {
    console.error("transcribe-stream error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
