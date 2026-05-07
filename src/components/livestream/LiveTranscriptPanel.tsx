import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptRow {
  id: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
  created_at: string;
}

function fmt(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveTranscriptPanel({ streamRoomId }: { streamRoomId: string | null }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<TranscriptRow[]>([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!streamRoomId) {
      setRows([]);
      setListening(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("transcripts")
        .select("id, start_seconds, end_seconds, text, created_at")
        .eq("stream_room_id", streamRoomId)
        .order("start_seconds", { ascending: true })
        .limit(200);
      if (!cancelled && data) setRows(data as TranscriptRow[]);
    };
    load();

    const ch = supabase
      .channel(`live-transcript-${streamRoomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transcripts", filter: `stream_room_id=eq.${streamRoomId}` },
        (payload) => {
          setRows((prev) => [...prev, payload.new as TranscriptRow].slice(-200));
          setListening(true);
          // Auto fade indicator after 5s of silence
          window.setTimeout(() => setListening(false), 5000);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [streamRoomId]);

  return (
    <div className="rounded-2xl bg-card border border-border/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Live Transcript
              {listening && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  AI listening
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {rows.length === 0 ? "Waiting for first transcription chunk…" : `${rows.length} chunks captured`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <ScrollArea className="h-64 rounded-lg border border-border/40 bg-background/40 p-3">
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">
                Transcription begins ~60s after stream goes live.
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="text-sm leading-relaxed">
                    <span className="font-mono text-[11px] text-muted-foreground mr-2">
                      [{fmt(r.start_seconds)}]
                    </span>
                    <span className="text-foreground">{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
