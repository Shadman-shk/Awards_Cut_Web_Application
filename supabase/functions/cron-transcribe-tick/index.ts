// cron-transcribe-tick: invoked every minute by pg_cron.
// Finds all stream_rooms with status='live' and fans out a transcribe-stream
// invocation for each. This makes server-side scheduling the source of truth
// for AI transcription — the browser tick is now redundant only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: liveRooms, error } = await admin
      .from("stream_rooms")
      .select("id")
      .eq("status", "live");

    if (error) {
      console.error("cron-transcribe-tick query error", error);
      return json({ error: error.message }, 500);
    }

    if (!liveRooms || liveRooms.length === 0) {
      return json({ ticked: 0, rooms: [] });
    }

    // Fan out — transcribe first, then run AI winner detection.
    const results = await Promise.allSettled(
      liveRooms.map(async (room) => {
        const tr = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ roomId: room.id }),
        });
        // Fire detect-winner regardless of transcribe result (it'll skip if no transcripts).
        // Don't await so latency stays low; cron retries each minute.
        fetch(`${SUPABASE_URL}/functions/v1/detect-winner`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ roomId: room.id }),
        }).catch((e) => console.warn("detect-winner fan-out failed", room.id, e));
        return { roomId: room.id, status: tr.status };
      })
    );

    const summary = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { roomId: liveRooms[i].id, error: String(r.reason) }
    );

    return json({ ticked: liveRooms.length, rooms: summary });
  } catch (e) {
    console.error("cron-transcribe-tick error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
