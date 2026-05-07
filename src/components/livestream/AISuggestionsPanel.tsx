import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, Loader2, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface PendingMoment {
  id: string;
  stream_room_id: string | null;
  timestamp_seconds: number | null;
  matched_phrase: string | null;
  matched_award_category_id: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

interface AwardCategory {
  id: string;
  name: string;
  recipient_name: string | null;
}

export function AISuggestionsPanel({ streamRoomId }: { streamRoomId: string | null }) {
  const [moments, setMoments] = useState<PendingMoment[]>([]);
  const [categories, setCategories] = useState<Record<string, AwardCategory>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!streamRoomId) {
      setMoments([]);
      return;
    }
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: cats } = await supabase
        .from("award_categories").select("id, name, recipient_name").eq("user_id", user.id);
      if (active && cats) {
        const map: Record<string, AwardCategory> = {};
        for (const c of cats) map[c.id] = c as AwardCategory;
        setCategories(map);
      }
      const { data } = await supabase
        .from("detected_moments")
        .select("id, stream_room_id, timestamp_seconds, matched_phrase, matched_award_category_id, confidence, status, created_at")
        .eq("stream_room_id", streamRoomId)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });
      if (active && data) setMoments(data as PendingMoment[]);
    })();

    const ch = supabase
      .channel(`ai-suggestions-${streamRoomId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "detected_moments", filter: `stream_room_id=eq.${streamRoomId}` },
        (payload) => {
          const m = payload.new as PendingMoment;
          if (m.status === "pending_review") setMoments(prev => [m, ...prev]);
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "detected_moments", filter: `stream_room_id=eq.${streamRoomId}` },
        (payload) => {
          const m = payload.new as PendingMoment;
          if (m.status !== "pending_review") setMoments(prev => prev.filter(x => x.id !== m.id));
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [streamRoomId]);

  const handleConfirm = async (m: PendingMoment) => {
    setBusyId(m.id);
    try {
      const { data: room } = await supabase
        .from("stream_rooms")
        .select("livepeer_playback_id, template_id, branding_json, started_at")
        .eq("id", m.stream_room_id!)
        .maybeSingle();

      if (!room?.livepeer_playback_id) {
        toast({ title: "No playback", description: "Stream room has no Livepeer playback ID yet.", variant: "destructive" });
        setBusyId(null); return;
      }

      const cat = m.matched_award_category_id ? categories[m.matched_award_category_id] : null;
      const { error } = await supabase.functions.invoke("generate-clip", {
        body: {
          playbackId: room.livepeer_playback_id,
          momentTimestampSeconds: m.timestamp_seconds ?? 0,
          momentType: "Award Announcement",
          winnerName: cat?.recipient_name || cat?.name || "Winner",
          momentId: m.id,
          clipDuration: 45,
          award_category_id: m.matched_award_category_id,
          stream_room_id: m.stream_room_id,
          stream_started_at: room.started_at,
          template_id: room.template_id ?? null,
          apply_branding: true,
          recipient_name: cat?.recipient_name ?? null,
        },
      });
      if (error) throw error;

      await supabase.from("detected_moments")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", m.id);

      toast({ title: "Clip generating", description: "We're cutting all three formats now." });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Could not generate clip", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (m: PendingMoment) => {
    setBusyId(m.id);
    await supabase.from("detected_moments")
      .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
      .eq("id", m.id);
    setBusyId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">AI Suggestions — Review &amp; Confirm</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  AI listens for award announcements and suggests moments. You confirm each one before it generates.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            {moments.length === 0 ? "Listening for award announcements…" : `${moments.length} suggestion${moments.length === 1 ? "" : "s"} awaiting review`}
          </p>
        </div>
        {moments.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> {moments.length}
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        <AnimatePresence>
          {moments.map((m) => {
            const cat = m.matched_award_category_id ? categories[m.matched_award_category_id] : null;
            const conf = m.confidence ?? 0.6;
            const confColor = conf >= 0.95 ? "bg-green-500/20 text-green-500"
              : conf >= 0.75 ? "bg-yellow-500/20 text-yellow-500"
              : "bg-orange-500/20 text-orange-500";
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-xl bg-muted/40 border border-border/30"
              >
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${confColor} shrink-0`}>
                    {Math.round(conf * 100)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground italic">“{m.matched_phrase}”</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suggested: <span className="text-foreground font-medium">{cat?.name ?? "Unmatched"}</span>
                      {cat?.recipient_name && <> · {cat.recipient_name}</>}
                      {" · "}@ {Math.floor((m.timestamp_seconds ?? 0) / 60)}:
                      {String(Math.floor((m.timestamp_seconds ?? 0) % 60)).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="hero" className="flex-1" disabled={busyId === m.id} onClick={() => handleConfirm(m)}>
                    {busyId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm &amp; Clip
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busyId === m.id} onClick={() => handleDismiss(m)}>
                    <X className="h-4 w-4" /> Dismiss
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {moments.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {streamRoomId ? "No suggestions yet — AI will surface them here as the ceremony progresses." : "Start a stream to begin AI listening."}
          </div>
        )}
      </div>
    </motion.div>
  );
}
