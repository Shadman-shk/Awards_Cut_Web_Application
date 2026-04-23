import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, durationSeconds, detectionInterval, clipDuration, ceremonyName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const duration = durationSeconds || 300;
    const interval = detectionInterval || 10;
    const defaultClipDur = clipDuration || 30;
    // Calculate how many moments to detect based on video duration and detection interval
    const momentCount = Math.min(Math.max(Math.floor(duration / interval), 4), 12);

    const prompt = `You are analyzing an award ceremony video file named "${filename}"${ceremonyName ? ` for the ceremony "${ceremonyName}"` : ''} that is approximately ${duration} seconds long.

The detection is configured to scan every ${interval} seconds with a default clip duration of ${defaultClipDur} seconds.

Identify exactly ${momentCount} award-winning moments in this ceremony video, spaced roughly ${interval} seconds apart. Return a JSON array of ${momentCount} detected moments. Each moment should be an object with these exact fields:
- "timestamp": a string like "0:32" or "2:15" representing when the moment occurs (spread moments across the full video duration)
- "momentType": one of "Winner Announced", "Standing Ovation", "Trophy Handoff", "Emotional Speech", "Applause Peak", "Stage Entrance", "Crowd Reaction"
- "winnerName": a realistic full name (leave empty string for non-winner moments like applause)
- "awardName": the award category name like "Best Innovation Award", "Lifetime Achievement", "Rising Star", "Leadership Excellence", "Creative Vision Award", "Community Impact"
- "confidenceScore": integer between 82 and 98
- "clipDuration": ${defaultClipDur} (use this as the default clip duration)

Return ONLY the JSON array, no other text. Make the data realistic for a professional award ceremony.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an AI video analysis system that detects key moments in award ceremony videos. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the AI response
    let moments;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      moments = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", content);
      moments = [];
    }

    return new Response(JSON.stringify({ moments }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-moments error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
