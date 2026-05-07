import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AwardCategory {
  id: string;
  name: string;
  recipient_name: string | null;
}

export function ManualTriggerPanel({
  streamRoomId,
  getPlayheadSeconds,
}: {
  streamRoomId: string | null;
  getPlayheadSeconds?: () => number;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [before, setBefore] = useState(15);
  const [after, setAfter] = useState(30);
  const [busy, setBusy] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("award_categories").select("id, name, recipient_name").eq("user_id", user.id)
        .order("scheduled_order", { ascending: true });
      if (data) setCategories(data as AwardCategory[]);
    })();
  }, []);

  const openModal = () => {
    if (!streamRoomId) {
      toast({ title: "No active stream", description: "Start a stream room first.", variant: "destructive" });
      return;
    }
    setPlayhead(getPlayheadSeconds ? getPlayheadSeconds() : 0);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!categoryId) {
      toast({ title: "Pick a category", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data: room } = await supabase
        .from("stream_rooms")
        .select("livepeer_playback_id, template_id, started_at")
        .eq("id", streamRoomId!)
        .maybeSingle();
      if (!room?.livepeer_playback_id) throw new Error("Stream has no playback ID yet");
      if (!room.started_at) throw new Error("Stream timing is not ready yet. Start AI Monitoring again, then trigger the clip.");

      const cat = categories.find(c => c.id === categoryId);
      const totalDuration = before + after;

      const { error } = await supabase.functions.invoke("generate-clip", {
        body: {
          playbackId: room.livepeer_playback_id,
          momentTimestampSeconds: playhead,
          momentType: "Manual Trigger",
          winnerName: cat?.recipient_name || cat?.name || "Winner",
          clipDuration: totalDuration,
          award_category_id: categoryId,
          stream_room_id: streamRoomId,
          stream_started_at: room.started_at,
          template_id: room.template_id ?? null,
          apply_branding: true,
          recipient_name: cat?.recipient_name ?? null,
          start_offset_seconds: -before,
          end_offset_seconds: after,
        },
      });
      if (error) throw error;
      toast({ title: "Clip generating", description: "All three formats are being cut now." });
      setOpen(false);
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Could not trigger clip", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-card border border-border/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Manual Trigger</h2>
            <p className="text-sm text-muted-foreground">Operator safety net for moments AI misses.</p>
          </div>
        </div>
        <Button variant="hero" size="lg" className="w-full" onClick={openModal} disabled={!streamRoomId}>
          <Zap className="h-5 w-5" /> TRIGGER CLIP NOW
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manual Clip Trigger</DialogTitle>
            <DialogDescription>
              Captured at <span className="font-mono text-foreground">{Math.floor(playhead / 60)}:{String(Math.floor(playhead % 60)).padStart(2, "0")}</span>.
              Adjust window if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Award Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.recipient_name ? ` — ${c.recipient_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Before (seconds)</Label>
                <Input type="number" min={0} max={60} value={before} onChange={(e) => setBefore(Number(e.target.value))} />
              </div>
              <div>
                <Label>After (seconds)</Label>
                <Input type="number" min={0} max={120} value={after} onChange={(e) => setAfter(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="hero" onClick={handleConfirm} disabled={busy || !categoryId}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
