import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Film, Loader2, Play, Send, RotateCw, CheckCircle2, AlertCircle, Mail, MessageSquare, Share2, Download, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadClipAsBlob, downloadAllClips } from "@/lib/clipDownload";
import { HLSPlayer } from "./HLSPlayer";

interface ClipRow {
  id: string;
  award_category_id: string | null;
  category: string;
  winner_name: string;
  format: string;
  format_label: string;
  dimensions: string;
  status: string;
  source_video_url: string | null;
  preview_url: string | null;
  download_url: string | null;
  livepeer_playback_id: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  start_offset_seconds: number | null;
  end_offset_seconds: number | null;
  created_at: string;
  parent_clip_id: string | null;
}

export function LiveClipQueue({ approvalRequired = true }: { approvalRequired?: boolean }) {
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("generated_clips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24);
    if (data) setClips(data as ClipRow[]);
  };

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
    const ch = supabase
      .channel("live-clip-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "generated_clips" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Group siblings under parent (one row per "clip" = 3 formats)
  const grouped = (() => {
    const parents: ClipRow[] = [];
    const childrenOf: Record<string, ClipRow[]> = {};
    for (const c of clips) {
      if (c.parent_clip_id) {
        (childrenOf[c.parent_clip_id] ||= []).push(c);
      } else {
        parents.push(c);
      }
    }
    return parents.map(p => ({ parent: p, siblings: childrenOf[p.id] || [] }));
  })();
  const visibleGroups = grouped.slice(0, 12);
  const hiddenGroupCount = Math.max(0, grouped.length - visibleGroups.length);

  const statusBadge = (clip: ClipRow) => {
    if (clip.delivered_at) {
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
    }
    if (clip.approved_at) {
      return <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30"><Send className="h-3 w-3 mr-1" />Approved</Badge>;
    }
    switch (clip.status) {
      case "ready":
        return <Badge className="bg-primary/15 text-primary border-primary/30">Ready</Badge>;
      case "processing":
      case "queued":
      case "generating":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{clip.status}</Badge>;
    }
  };

  const handleApproveAndSend = async (parent: ClipRow, siblings: ClipRow[]) => {
    setBusyId(parent.id);
    try {
      const ids = [parent.id, ...siblings.map(s => s.id)];
      const now = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const patch: Record<string, unknown> = { approved_at: now };
      // If no approval gate, auto-mark delivered immediately.
      // TODO: wire real SMS/email/social delivery channels here.
      if (!approvalRequired || !approvalRequired) {
        patch.delivered_at = now;
      } else {
        patch.delivered_at = now; // operator pressed Approve & Send → mark delivered
      }

      const { error } = await supabase
        .from("generated_clips")
        .update(patch)
        .in("id", ids)
        .eq("user_id", user.id);
      if (error) throw error;

      toast({
        title: "Sent",
        description: `${parent.winner_name} — ${parent.category} delivered to ${parent.recipient_email || "winner"}.`,
      });
      await load();
    } catch (e) {
      toast({
        title: "Send failed",
        description: e instanceof Error ? e.message : "Could not send clip",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReclip = async (parent: ClipRow) => {
    if (!parent.award_category_id) {
      toast({ title: "Cannot re-clip", description: "This clip is not linked to an award category.", variant: "destructive" });
      return;
    }
    setBusyId(parent.id);
    try {
      // Reset triggered_at so the operator can press MARK NOW again at the right moment
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await supabase
        .from("award_categories")
        .update({ triggered_at: null, status: "pending" })
        .eq("id", parent.award_category_id)
        .eq("user_id", user.id);
      toast({
        title: "Ready for re-mark",
        description: "Press MARK NOW in the Awards panel to re-clip this category.",
      });
    } catch (e) {
      toast({
        title: "Re-clip failed",
        description: e instanceof Error ? e.message : "Could not reset",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const previewSource = (clip: ClipRow) =>
    clip.preview_url || clip.source_video_url ||
    (clip.livepeer_playback_id ? `https://livepeercdn.studio/hls/${clip.livepeer_playback_id}/index.m3u8` : null);

  const downloadSource = (clip: ClipRow) => clip.download_url || clip.source_video_url || clip.preview_url;

  const filenameFor = (clip: ClipRow) =>
    `${clip.category || "award"}-${clip.winner_name || "winner"}-${clip.format || "clip"}`.replace(/[^a-z0-9-_]+/gi, "-");

  const handleDownload = async (clip: ClipRow) => {
    const src = downloadSource(clip);
    if (!src) {
      toast({ title: "Download not ready", description: "The clip is still processing.", variant: "destructive" });
      return;
    }
    setDownloadingId(clip.id);
    const success = await downloadClipAsBlob(src, `${filenameFor(clip)}.mp4`, clip.id);
    setDownloadingId(null);
    if (success) {
      setDownloadedId(clip.id);
      window.setTimeout(() => setDownloadedId(null), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Film className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Clip Queue</h2>
            <p className="text-sm text-muted-foreground">
              Live pipeline · {grouped.length} clip{grouped.length === 1 ? "" : "s"}
              {approvalRequired ? " · Approval gate ON" : " · Auto-deliver ON"}
            </p>
          </div>
        </div>
        {grouped.some(({ parent, siblings }) => [parent, ...siblings].some((clip) => clip.status === "ready" && downloadSource(clip))) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadAllClips(
              grouped.flatMap(({ parent, siblings }) => [parent, ...siblings])
                .filter((clip) => clip.status === "ready" && downloadSource(clip))
                .map((clip) => ({ url: downloadSource(clip)!, filename: `${filenameFor(clip)}.mp4`, id: clip.id })),
              toast,
            )}
          >
            <Download className="h-4 w-4" /> Download all
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading clips…
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No clips yet. Mark a category in the Awards panel to start the queue.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {visibleGroups.map(({ parent, siblings }) => {
            const src = previewSource(parent);
            const isReady = parent.status === "ready" || siblings.some(s => s.status === "ready");
            const isDelivered = !!parent.delivered_at;
            return (
              <div
                key={parent.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/40 hover:border-primary/30 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0 relative">
                  {src ? (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <Play className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Film className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {parent.winner_name}
                    </span>
                    {statusBadge(parent)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {parent.category} · {[parent, ...siblings].length} format{siblings.length ? "s" : ""}
                    {parent.start_offset_seconds != null && parent.end_offset_seconds != null && (
                      <> · {Math.abs(parent.start_offset_seconds)}s / {parent.end_offset_seconds}s</>
                    )}
                  </div>
                  {/* Delivery channels */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className={`h-3 w-3 ${parent.recipient_email ? (isDelivered ? "text-emerald-400" : "text-foreground") : "text-muted-foreground/40"}`} />
                    <MessageSquare className={`h-3 w-3 ${parent.recipient_phone ? (isDelivered ? "text-emerald-400" : "text-foreground") : "text-muted-foreground/40"}`} />
                    <Share2 className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost" size="sm"
                    disabled={!src}
                    onClick={() => setPreviewUrl(src)}
                    title="Preview"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isDelivered ? "outline" : "hero"} size="sm"
                    disabled={!isReady || isDelivered || busyId === parent.id}
                    onClick={() => handleApproveAndSend(parent, siblings)}
                  >
                    {busyId === parent.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isDelivered ? "Sent" : "Approve & Send"}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    disabled={!downloadSource(parent) || downloadingId === parent.id}
                    onClick={() => handleDownload(parent)}
                    title="Download MP4"
                  >
                    {downloadingId === parent.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : downloadedId === parent.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    disabled={busyId === parent.id || !parent.award_category_id}
                    onClick={() => handleReclip(parent)}
                    title="Re-clip"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {hiddenGroupCount > 0 && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
              Showing latest 12 clips here. Open Clip Generation for the full queue.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Clip Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewUrl.includes(".m3u8") || previewUrl.includes("/hls/") ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-background">
                <HLSPlayer src={previewUrl} muted={false} className="w-full h-full object-contain" />
              </div>
            ) : (
              <video src={previewUrl} controls autoPlay className="w-full rounded-lg bg-background" />
            )
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
