// zip-clips: takes an array of clip IDs owned by the caller and streams
// back a ZIP containing each clip's MP4. Uses a minimal STORE-only ZIP
// writer (no compression — MP4 is already compressed).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CRC32 (browser-safe)
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
function u32(n: number) {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
}
function concat(arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0),
      nameBytes, f.data,
    ]);
    localParts.push(local);
    central.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameBytes.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset),
      nameBytes,
    ]));
    offset += local.length;
  }
  const centralBlob = concat(central);
  const eocd = concat([
    u32(0x06054b50), u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(centralBlob.length), u32(offset), u16(0),
  ]);
  return concat([...localParts, centralBlob, eocd]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { clipIds } = await req.json();
    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      return new Response(JSON.stringify({ error: "clipIds[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: clips } = await supabase
      .from("generated_clips")
      .select("id, winner_name, format, source_video_url, status")
      .in("id", clipIds)
      .eq("user_id", user.id);

    const ready = (clips ?? []).filter(
      (c) => c.source_video_url && (c.status === "ready" || c.status === "delivered" || c.status === "approved"),
    );

    const files: { name: string; data: Uint8Array }[] = [];
    for (const c of ready) {
      try {
        const r = await fetch(c.source_video_url!.split("?")[0]);
        if (!r.ok) continue;
        const buf = new Uint8Array(await r.arrayBuffer());
        const safe = (c.winner_name || "clip").replace(/[^a-z0-9]/gi, "_");
        files.push({ name: `${safe}-${c.format}.mp4`, data: buf });
      } catch (e) {
        console.warn("Skip clip", c.id, e);
      }
    }

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: "No downloadable clips" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zip = buildZip(files);
    return new Response(zip, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="awardscut-clips-${Date.now()}.zip"`,
      },
    });
  } catch (e) {
    console.error("zip-clips error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
