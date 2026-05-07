import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Zap, RotateCw, Settings2, CheckCircle2, Clock, AlertCircle, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AwardCategory {
  id: string;
  name: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  scheduled_order: number;
  status: string;
  triggered_at: string | null;
}

interface ClipRow {
  id: string;
  award_category_id: string | null;
  status: string;
  format: string;
  delivered_at: string | null;
  approved_at: string | null;
}

const DEFAULT_BEFORE = 15;
const DEFAULT_AFTER = 45;

export function AwardsControlPanel({
  streamRoomId,
  getPlayheadSeconds,
  aiEnabled,
  setAiEnabled,
  aiThreshold,
  setAiThreshold,
}: {
  streamRoomId: string | null;
  getPlayheadSeconds: () => number;
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  aiThreshold: number;
  setAiThreshold: (threshold: number) => void;
}) {
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [clipsByCategory, setClipsByCategory] = useState<Record<string, ClipRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "marked">("all");
  // Per-category roll overrides (else use defaults)
  const [rolls, setRolls] = useState<Record<string, { before: number; after: number }>>({});

  // AI auto-detect state
  const [autoFiredCount, setAutoFiredCount] = useState(0);
  const [pendingMoments, setPendingMoments] = useState<Array<{
    id: string;
    award_name: string | null;
    winner_name: string | null;
    matched_award_category_id: string | null;
    confidence: number | null;
    confidence_score: number | null;
    timestamp_seconds: number | null;
    clip_start: number | null;
    clip_end: number | null;
  }>>([]);

  const loadDetectedMoments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pending } = await supabase
      .from("detected_moments")
      .select("id, award_name, winner_name, matched_award_category_id, confidence, confidence_score, timestamp_seconds, clip_start, clip_end, status")
      .eq("user_id", user.id)
      .eq("status", "pending_review")
      .not("matched_award_category_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (pending) setPendingMoments(pending as any);

    const { count } = await supabase
      .from("detected_moments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "auto_confirmed");
    setAutoFiredCount(count ?? 0);
  };

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("award_categories")
      .select("id, name, recipient_name, recipient_email, recipient_phone, scheduled_order, status, triggered_at")
      .eq("user_id", user.id)
      .order("scheduled_order", { ascending: true });
    if (data) setCategories(data as AwardCategory[]);
  };

  const loadClips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("generated_clips")
      .select("id, award_category_id, status, format, delivered_at, approved_at")
      .eq("user_id", user.id)
      .not("award_category_id", "is", null)
      .order("created_at", { ascending: false });
    if (data) {
      const grouped: Record<string, ClipRow[]> = {};
      for (const c of data as ClipRow[]) {
        if (!c.award_category_id) continue;
        (grouped[c.award_category_id] ||= []).push(c);
      }
      setClipsByCategory(grouped);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadCategories(), loadClips(), loadDetectedMoments()]);
      setLoading(false);
    })();

    const ch = supabase
      .channel("awards-control-clips")
      .on("postgres_changes", { event: "*", schema: "public", table: "generated_clips" }, () => loadClips())
      .on("postgres_changes", { event: "*", schema: "public", table: "award_categories" }, () => loadCategories())
      .on("postgres_changes", { event: "*", schema: "public", table: "detected_moments" }, () => loadDetectedMoments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const confirmDetection = async (mom: typeof pendingMoments[number]) => {
    const cat = categories.find(c => c.id === mom.matched_award_category_id);
    if (!cat) {
      await supabase.from("detected_moments").update({ status: "dismissed", dismissed_at: new Date().toISOString() }).eq("id", mom.id);
      setPendingMoments(p => p.filter(x => x.id !== mom.id));
      toast({ title: "AI pick ignored", description: "This old detection is not linked to an award category.", variant: "destructive" });
      return;
    }
    const marked = await markCategory(cat, false, mom.timestamp_seconds ?? undefined, {
      before: mom.clip_start != null && mom.timestamp_seconds != null ? Math.max(0, mom.timestamp_seconds - mom.clip_start) : undefined,
      after: mom.clip_end != null && mom.timestamp_seconds != null ? Math.max(1, mom.clip_end - mom.timestamp_seconds) : undefined,
    });
    if (!marked) return;
    await supabase.from("detected_moments").update({ status: "auto_confirmed", confirmed_at: new Date().toISOString() }).eq("id", mom.id);
    setPendingMoments(p => p.filter(x => x.id !== mom.id));
  };

  const rejectDetection = async (mom: typeof pendingMoments[number]) => {
    await supabase.from("detected_moments").update({ status: "dismissed", dismissed_at: new Date().toISOString() }).eq("id", mom.id);
    setPendingMoments(p => p.filter(x => x.id !== mom.id));
  };

  const filtered = useMemo(() => {
    if (filter === "pending") return categories.filter(c => !c.triggered_at);
    if (filter === "marked") return categories.filter(c => c.triggered_at);
    return categories;
  }, [categories, filter]);

  const markCategory = async (
    cat: AwardCategory,
    isReMark = false,
    overridePlayhead?: number,
    overrideRolls?: { before?: number; after?: number },
  ) => {
    if (!streamRoomId) {
      toast({ title: "No active stream", description: "Start a stream room first.", variant: "destructive" });
      return false;
    }
    setBusyId(cat.id);
    try {
      const { data: room } = await supabase
        .from("stream_rooms")
        .select("livepeer_playback_id, template_id, started_at")
        .eq("id", streamRoomId)
        .maybeSingle();
      if (!room?.livepeer_playback_id) throw new Error("Stream has no playback ID yet");
      if (!room.started_at) throw new Error("Stream timing is not ready yet. Start AI Monitoring again, then mark the winner.");

      const playhead = overridePlayhead ?? getPlayheadSeconds();
      const before = overrideRolls?.before ?? rolls[cat.id]?.before ?? DEFAULT_BEFORE;
      const after = overrideRolls?.after ?? rolls[cat.id]?.after ?? DEFAULT_AFTER;

      const { error } = await supabase.functions.invoke("generate-clip", {
        body: {
          playbackId: room.livepeer_playback_id,
          momentTimestampSeconds: playhead,
          momentType: cat.name,
          winnerName: cat.recipient_name || cat.name,
          clipDuration: before + after,
          award_category_id: cat.id,
          stream_room_id: streamRoomId,
          stream_started_at: room.started_at,
          template_id: room.template_id ?? null,
          apply_branding: true,
          recipient_name: cat.recipient_name ?? null,
          start_offset_seconds: -before,
          end_offset_seconds: after,
        },
      });
      if (error) throw error;

      // Stamp category as triggered
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("award_categories")
          .update({ triggered_at: new Date().toISOString(), status: "clipping" })
          .eq("id", cat.id)
          .eq("user_id", user.id);
      }

      toast({
        title: isReMark ? "Re-marked" : "🎬 MARKED",
        description: `${cat.name} — clipping ${before}s before / ${after}s after`,
      });
      await Promise.all([loadCategories(), loadClips()]);
      return true;
    } catch (e) {
      toast({
        title: "Mark failed",
        description: e instanceof Error ? e.message : "Could not trigger clip",
        variant: "destructive",
      });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const renderStatusBadge = (cat: AwardCategory) => {
    const clips = clipsByCategory[cat.id] || [];
    if (!cat.triggered_at && clips.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
    const anyDelivered = clips.some(c => c.delivered_at);
    const anyReady = clips.some(c => c.status === "ready");
    const anyProcessing = clips.some(c => c.status === "queued" || c.status === "processing" || c.status === "generating");
    const anyFailed = clips.some(c => c.status === "failed");

    if (anyDelivered) return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
    if (anyReady) return <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>;
    if (anyProcessing) return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
    if (anyFailed) return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    return <Badge className="bg-primary/15 text-primary border-primary/30"><Clock className="h-3 w-3 mr-1" />Recording</Badge>;
  };

  const formatTimecode = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl bg-card border border-border/50 flex flex-col max-h-[calc(100vh-9rem)] xl:h-[calc(100vh-9rem)]"
    >
      <div className="p-5 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">Awards Control</h2>
            <p className="text-xs text-muted-foreground">AI auto-detects winners. MARK NOW always overrides.</p>
          </div>
        </div>

        {/* AI Auto-Detect controls */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className={`h-4 w-4 shrink-0 ${aiEnabled ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <Label htmlFor="ai-auto" className="text-sm font-semibold text-foreground cursor-pointer">
                  AI Auto-Detect
                </Label>
                <div className="text-[11px] text-muted-foreground truncate">
                  {aiEnabled
                    ? `${autoFiredCount} auto-marked · ${pendingMoments.length} awaiting confirm`
                    : "Off — manual MARK NOW only"}
                </div>
              </div>
            </div>
            <Switch id="ai-auto" checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
          {aiEnabled && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[11px] text-muted-foreground">Auto-fire confidence</Label>
                <span className="text-[11px] font-mono text-foreground">{Math.round(aiThreshold * 100)}%</span>
              </div>
              <Slider
                value={[aiThreshold * 100]}
                min={50}
                max={95}
                step={5}
                onValueChange={(v) => setAiThreshold(v[0] / 100)}
              />
            </div>
          )}
        </div>

        {/* Pending confirmation banner */}
        {aiEnabled && pendingMoments.length > 0 && (
          <div className="space-y-2">
            {pendingMoments.map(mom => (
              <div key={mom.id} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                <div className="text-xs text-amber-200 mb-2">
                  <span className="font-semibold">AI detected</span>: {mom.winner_name || "—"} for {mom.award_name || "—"}
                  <span className="ml-2 font-mono opacity-70">{mom.confidence != null ? Math.round(mom.confidence * 100) : (mom.confidence_score ?? 0)}%</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="hero" className="flex-1 h-7 text-xs" onClick={() => confirmDetection(mom)}>
                    <Check className="h-3 w-3" /> Confirm
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => rejectDetection(mom)}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1">
          {(["all", "pending", "marked"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f} {f === "all" ? `(${categories.length})` : f === "pending" ? `(${categories.filter(c => !c.triggered_at).length})` : `(${categories.filter(c => c.triggered_at).length})`}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading awards…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {categories.length === 0 ? (
              <>No awards uploaded yet. Add them in the Awards Manager.</>
            ) : (
              <>No categories match this filter.</>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(cat => {
              const before = rolls[cat.id]?.before ?? DEFAULT_BEFORE;
              const after = rolls[cat.id]?.after ?? DEFAULT_AFTER;
              const isMarked = !!cat.triggered_at;
              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl border border-border/40 bg-background/40 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">{cat.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {cat.recipient_name ? `🏆 ${cat.recipient_name}` : "Winner TBD"}
                      </div>
                    </div>
                    {renderStatusBadge(cat)}
                  </div>

                  {isMarked && (
                    <div className="text-[11px] font-mono text-muted-foreground mb-2">
                      Marked at {formatTimecode(cat.triggered_at)} · −{before}s / +{after}s
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isMarked ? "outline" : "hero"}
                      size="sm"
                      className="flex-1"
                      disabled={busyId === cat.id || !streamRoomId}
                      onClick={() => markCategory(cat, isMarked)}
                    >
                      {busyId === cat.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isMarked ? (
                        <RotateCw className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      {isMarked ? "Re-mark" : "MARK NOW"}
                    </Button>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" title="Adjust pre/post-roll">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="end">
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-foreground">Clip window</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[11px]">Before (s)</Label>
                              <Input
                                type="number" min={0} max={120} value={before}
                                onChange={(e) => setRolls(r => ({ ...r, [cat.id]: { before: Number(e.target.value), after } }))}
                              />
                            </div>
                            <div>
                              <Label className="text-[11px]">After (s)</Label>
                              <Input
                                type="number" min={0} max={300} value={after}
                                onChange={(e) => setRolls(r => ({ ...r, [cat.id]: { before, after: Number(e.target.value) } }))}
                              />
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Default: {DEFAULT_BEFORE}s before / {DEFAULT_AFTER}s after
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
