import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Video, Download, Loader2, Search, Trash2, Play, Copy, RefreshCw, FileVideo,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadClipAsBlob } from "@/lib/clipDownload";

interface ClipRow {
  id: string;
  winner_name: string;
  category: string;
  format: string;
  format_label: string;
  dimensions: string;
  duration_label: string | null;
  status: string;
  source_video_url: string | null;
  download_url: string | null;
  preview_url: string | null;
  created_at: string;
  event_id: string | null;
}

const STATUS_FILTERS = ["all", "ready", "delivered", "processing", "queued", "failed"];
export default function AllClips() {
  const navigate = useNavigate();
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewClip, setPreviewClip] = useState<ClipRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClipRow | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("generated_clips")
      .select("id, winner_name, category, format, format_label, dimensions, duration_label, status, source_video_url, download_url, preview_url, created_at, event_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load clips", description: error.message, variant: "destructive" });
    } else {
      setClips((data ?? []) as ClipRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("all-clips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "generated_clips" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clips.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.winner_name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.format_label?.toLowerCase().includes(q)
      );
    });
  }, [clips, search, statusFilter]);

  const counts = useMemo(() => ({
    total: clips.length,
    ready: clips.filter(c => c.status === "ready" || c.status === "delivered").length,
    processing: clips.filter(c => c.status === "processing" || c.status === "queued").length,
    failed: clips.filter(c => c.status === "failed").length,
  }), [clips]);

  const handleDownload = async (clip: ClipRow) => {
    const url = clip.download_url || clip.source_video_url || clip.preview_url;
    if (!clip.download_url && !clip.source_video_url && !clip.preview_url) {
      toast({ title: "No file available", description: "This clip has no downloadable source yet.", variant: "destructive" });
      return;
    }
    setDownloadingId(clip.id);
    const filename = `${(clip.winner_name || "clip").replace(/\s+/g, "_")}-${clip.format || "clip"}.mp4`;
    await downloadClipAsBlob(url, filename, clip.id);
    setDownloadingId(null);
  };

  const handleCopy = (clip: ClipRow) => {
    const url = clip.download_url || clip.source_video_url || clip.preview_url;
    if (!url) return toast({ title: "No URL", variant: "destructive" });
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Clip URL is on your clipboard." });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("generated_clips").delete().eq("id", confirmDelete.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Clip deleted", description: confirmDelete.winner_name });
      setClips(prev => prev.filter(c => c.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  const handleDeleteAll = async () => {
    setBulkDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBulkDeleting(false); setConfirmDeleteAll(false); return; }

    const ids = filtered.map(c => c.id);
    if (ids.length === 0) {
      setBulkDeleting(false);
      setConfirmDeleteAll(false);
      return;
    }

    // Chunk to keep the URL under PostgREST's request size limit (long
    // `id=in.(...)` lists return 400 Bad Request beyond ~100-200 ids).
    const CHUNK = 100;
    const removed = new Set<string>();
    let firstError: string | null = null;

    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("generated_clips")
        .delete()
        .eq("user_id", user.id)
        .in("id", slice);
      if (error) {
        if (!firstError) firstError = error.message;
        break;
      }
      slice.forEach(id => removed.add(id));
    }

    if (removed.size > 0) {
      setClips(prev => prev.filter(c => !removed.has(c.id)));
    }

    if (firstError) {
      toast({
        title: removed.size > 0 ? `Deleted ${removed.size} of ${ids.length}` : "Bulk delete failed",
        description: firstError,
        variant: "destructive",
      });
    } else {
      toast({ title: `Deleted ${removed.size} clip${removed.size === 1 ? "" : "s"}`, description: "All matching clips have been removed." });
    }
    setBulkDeleting(false);
    setConfirmDeleteAll(false);
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      queued: "bg-muted text-muted-foreground",
      processing: "bg-primary/20 text-primary",
      ready: "bg-green-500/20 text-green-500",
      delivered: "bg-blue-500/20 text-blue-500",
      failed: "bg-destructive/20 text-destructive",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[s] ?? styles.queued}`}>{s}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Clips</h1>
            <p className="text-muted-foreground">All clips from AI monitoring and Clip Generation in one place.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" size="sm" onClick={() => navigate("/dashboard/clip-generation?focus=latest")}>
              <Video className="h-4 w-4" /> Open Clip Generation
            </Button>
            {filtered.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDeleteAll(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete {filtered.length === clips.length ? "All" : "Filtered"} ({filtered.length})
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", count: counts.total, color: "text-foreground" },
            { label: "Ready", count: counts.ready, color: "text-green-500" },
            { label: "Processing", count: counts.processing, color: "text-primary" },
            { label: "Failed", count: counts.failed, color: "text-destructive" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by winner, category or format…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(s => (
                <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card border border-border/50">
            <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">No clips match</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {clips.length === 0
                ? "Generate clips from the Livestream or Clip Generation pages — they'll all appear here."
                : "Try a different search or status filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(clip => {
              const url = clip.download_url || clip.source_video_url || clip.preview_url;
              const playable = clip.status === "ready" || clip.status === "delivered";
              return (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-card border border-border/50 flex flex-col"
                >
                  <button
                    onClick={() => playable && setPreviewClip(clip)}
                    className={`relative rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mb-3 flex items-center justify-center ${
                      clip.format === "vertical" ? "aspect-[9/16] max-h-48" :
                      clip.format === "square" ? "aspect-square max-h-48" :
                      "aspect-video"
                    } ${playable ? "cursor-pointer hover:from-primary/30" : "cursor-default"}`}
                  >
                    {clip.status === "processing" || clip.status === "queued" ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : playable ? (
                      <Play className="h-10 w-10 text-primary" />
                    ) : (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground truncate">{clip.winner_name || "Untitled"}</span>
                    {statusBadge(clip.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">{clip.category || "—"}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {clip.format_label} · {clip.dimensions}{clip.duration_label ? ` · ${clip.duration_label}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {new Date(clip.created_at).toLocaleString()}
                  </p>

                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    disabled={downloadingId === clip.id}
                      onClick={() => handleDownload(clip)}
                      title="Download"
                    >
                      {downloadingId === clip.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" disabled={!url} onClick={() => handleCopy(clip)} title="Copy link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(clip)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!previewClip} onOpenChange={() => setPreviewClip(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{previewClip?.winner_name}</DialogTitle>
            <DialogDescription>
              {previewClip?.category} · {previewClip?.format_label} · {previewClip?.dimensions}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video rounded-xl bg-black overflow-hidden">
            {previewClip ? (
              <video
                key={previewClip.id}
                src={previewClip.download_url || previewClip.source_video_url || previewClip.preview_url || undefined}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>
          {previewClip && !previewClip.download_url && !previewClip.source_video_url && !previewClip.preview_url && (
            <p className="text-xs text-muted-foreground -mt-2">Demo preview — run AI monitoring on a real stream or upload to create real clip files.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => previewClip && handleDownload(previewClip)} disabled={!previewClip || downloadingId === previewClip.id}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this clip?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.winner_name}" will be removed from your library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteAll} onOpenChange={(o) => !o && !bulkDeleting && setConfirmDeleteAll(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {filtered.length === clips.length ? "all" : "filtered"} clips?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{filtered.length}</strong> clip{filtered.length === 1 ? "" : "s"} from your library.
              {filtered.length !== clips.length && " Only clips matching your current search and status filter will be deleted."}
              {" "}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAll(); }}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Delete ${filtered.length}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
