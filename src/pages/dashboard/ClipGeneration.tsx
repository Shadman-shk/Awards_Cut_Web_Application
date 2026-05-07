import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Video, Download, Copy, Share2, Play, Loader2, CheckCircle, Clock,
  Sparkles, Instagram, Linkedin, Twitter, Facebook, ExternalLink, RefreshCw,
  Check, ChevronDown,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { downloadClipAsBlob, downloadAllClips, resolveDownloadUrl } from "@/lib/clipDownload";
import { getBranding, subscribeBranding, type BrandingSettings } from "@/lib/brandingStore";
import { burnInBrandedClip } from "@/lib/burnInBranding";
import { ClipPipelineGuide } from "@/components/dashboard/ClipPipelineGuide";

interface Clip {
  id: string;
  moment_id: string | null;
  winner_name: string;
  category: string;
  format: string;
  dimensions: string;
  format_label: string;
  status: string;
  duration_label: string | null;
  source_video_url: string | null;
  download_url?: string | null;
  preview_url?: string | null;
  created_at: string;
  updated_at: string;
  award_category_id?: string | null;
  recipient_name?: string | null;
  start_offset_seconds?: number | null;
  end_offset_seconds?: number | null;
  trigger_timestamp?: string | null;
}

interface AwardCategory {
  id: string;
  name: string;
  recipient_name: string | null;
}

interface Moment {
  id: string;
  clip_start: number | null;
  clip_end: number | null;
  timestamp_seconds: number | null;
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Derive the human label for a clip:
 * - If linked to an award category → "{recipient} — {category}"
 * - Untagged manual trigger → "Manual clip at mm:ss"
 * - Otherwise fall back to whatever winner/category was saved.
 */
function deriveClipLabel(
  clip: Clip,
  categoryById: Map<string, AwardCategory>,
  momentById: Map<string, Moment>
): { winner: string; category: string } {
  if (clip.award_category_id) {
    const cat = categoryById.get(clip.award_category_id);
    const recipient = clip.recipient_name || cat?.recipient_name || clip.winner_name || "Recipient";
    const categoryName = cat?.name || clip.category || "Award";
    return { winner: recipient, category: categoryName };
  }
  // No award link, but we may still have a winner_name & category populated by AI/seed
  const hasWinner = clip.winner_name && clip.winner_name.trim() && clip.winner_name.toLowerCase() !== "untagged";
  const hasCategory = clip.category && clip.category.trim() && clip.category.toLowerCase() !== "untagged";
  if (hasWinner || hasCategory) {
    return {
      winner: hasWinner ? clip.winner_name : "Award Winner",
      category: hasCategory ? clip.category : "Award",
    };
  }
  // Untagged → manual or AI suggestion. Use timestamp-based label.
  const moment = clip.moment_id ? momentById.get(clip.moment_id) : undefined;
  const seconds = clip.start_offset_seconds ?? moment?.timestamp_seconds ?? moment?.clip_start ?? 0;
  return { winner: `Manual clip at ${formatMmSs(seconds)}`, category: "Untagged" };
}

function templateBackdrop(branding: BrandingSettings) {
  const primary = branding.primaryColor || "#B5553A";
  const secondary = branding.secondaryColor || "#D4A853";
  const type = branding.templateType || "event";
  if (type === "luxury") return `radial-gradient(circle at 50% 20%, ${secondary}66, transparent 34%), linear-gradient(135deg, #120d08, ${primary}55 55%, #050505)`;
  if (type === "corporate") return `linear-gradient(135deg, #0f172a, ${primary}44 45%, #111827), radial-gradient(circle at 80% 10%, ${secondary}55, transparent 30%)`;
  if (type === "modern") return `linear-gradient(135deg, #18181b, ${primary}40 50%, #09090b), linear-gradient(90deg, transparent, ${secondary}33)`;
  if (type === "minimal") return `linear-gradient(135deg, #2a2a2a, #111), radial-gradient(circle at 20% 80%, ${primary}44, transparent 35%)`;
  if (type === "social") return `radial-gradient(circle at 20% 20%, ${secondary}66, transparent 32%), linear-gradient(135deg, ${primary}66, #2a1233 55%, #0a0a0a)`;
  return `radial-gradient(circle at 50% 10%, ${secondary}44, transparent 32%), linear-gradient(135deg, ${primary}66, #2a1111 55%, #070707)`;
}

function logoPlacementClass(placement?: BrandingSettings["logoPlacement"]) {
  const map: Record<string, string> = {
    "top-left": "top-3 left-3",
    "top-right": "top-3 right-3",
    "bottom-left": "bottom-20 left-4",
    "bottom-right": "top-3 right-3",
    center: "top-3 right-3",
  };
  return map[placement || "top-right"] || map["top-right"];
}

function textLayoutClass(layout?: BrandingSettings["textLayout"]) {
  if (layout === "left") return "items-start text-left";
  if (layout === "right") return "items-end text-right";
  if (layout === "center") return "items-center text-center";
  return "items-start text-left";
}

function previewAspectClass(format?: string) {
  if (format === "vertical") return "aspect-[9/16] max-h-[72vh] w-auto mx-auto";
  if (format === "square") return "aspect-square max-h-[72vh] w-auto mx-auto";
  return "aspect-video w-full";
}

function isUsableAssetUrl(url?: string | null) {
  return !!url && !url.startsWith("blob:") && !url.startsWith("file:");
}

export default function ClipGeneration() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>(() => getBranding());

  useEffect(() => {
    const unsub = subscribeBranding((b) => {
      setBranding(b);
      toast({ title: "Branding applied", description: "Your logo, colors and music now appear on every clip." });
    });
    return unsub;
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('clip-generation-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_clips' }, (payload) => {
        // A clip is valid if it's currently being processed (no URL yet but
        // status reflects that) OR if it's ready/delivered with a real URL.
        // We must NEVER drop a "processing" row just because URL is null —
        // that's the legitimate state for newly-created Livepeer clips.
        const isValid = (c: any) => {
          if (!c) return false;
          const hasUrl = [c.download_url, c.source_video_url, c.preview_url].some((url) => typeof url === "string" && url.trim().length > 0);
          if (["processing", "queued", "failed"].includes(c.status)) return true;
          return hasUrl;
        };

        if (payload.eventType === 'UPDATE') {
          const next = payload.new as Clip;
          setClips(prev => {
            const existing = prev.find(c => c.id === next.id);
            if (existing) {
              return isValid(next) ? prev.map(c => c.id === next.id ? next : c) : prev.filter(c => c.id !== next.id);
            }
            return isValid(next) ? [next, ...prev] : prev;
          });
        } else if (payload.eventType === 'INSERT') {
          const next = payload.new as Clip;
          if (!isValid(next)) return;
          setClips(prev => {
            if (prev.find(c => c.id === next.id)) return prev;
            return [next, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setClips(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [clipsRes, momentsRes, catsRes] = await Promise.all([
      supabase.from('generated_clips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('detected_moments').select('id, clip_start, clip_end, timestamp_seconds').eq('user_id', user.id),
      supabase.from('award_categories').select('id, name, recipient_name').eq('user_id', user.id),
    ]);

    // Show clips that are processing (URL still null is expected while
    // Livepeer renders the asset) OR have a real playable URL. Exclude the
    // old-bug pattern: status="ready"/"delivered" with no source URL.
    if (clipsRes.data) {
      setClips(
        (clipsRes.data as any[]).filter((c) => {
          const hasUrl = [c.download_url, c.source_video_url, c.preview_url].some((url) => typeof url === "string" && url.trim().length > 0);
          if (["processing", "queued", "failed"].includes(c.status)) return true;
          return hasUrl;
        }),
      );
    }
    if (momentsRes.data) setMoments(momentsRes.data as any);
    if (catsRes.data) setCategories(catsRes.data as any);
    setLoading(false);
  };

  const getMoment = (momentId: string | null) => moments.find(m => m.id === momentId);

  const categoryById = new Map(categories.map(c => [c.id, c]));
  const momentById = new Map(moments.map(m => [m.id, m]));

  // Only real Livepeer clip URLs are playable. No demo fallback — if a clip
  // has no source URL it stays in "processing" UI until generate-clip finishes.
  const getPlayableUrl = (clip: Clip | null): string | null =>
    clip?.source_video_url || clip?.preview_url || clip?.download_url || null;

  const getDownloadUrl = (clip: Clip): string | null =>
    clip.download_url || clip.source_video_url || clip.preview_url || null;

  useEffect(() => {
    if (previewClip && videoRef.current) {
      const url = getPlayableUrl(previewClip);
      if (!url) return;
      const video = videoRef.current;
      const moment = getMoment(previewClip.moment_id);
      const isHls = url.includes(".m3u8");
      let hls: Hls | null = null;
      let hasStarted = false;
      video.pause();
      video.removeAttribute("src");
      video.load();

      const onReady = () => {
        if (hasStarted) return;
        hasStarted = true;
        if (Number.isFinite(video.duration) && video.duration > 1) {
          video.currentTime = Math.min(0.25, video.duration / 10);
        }
        video.play().catch(() => {});
        if (branding.musicTrackUrl) {
          if (!musicRef.current) musicRef.current = new Audio();
          musicRef.current.src = branding.musicTrackUrl;
          musicRef.current.loop = true;
          musicRef.current.volume = 0.6;
          musicRef.current.play().catch(() => {});
        }
      };

      video.muted = !!branding.musicTrackUrl;

      if (isHls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls?.loadSource(url));
        hls.on(Hls.Events.MANIFEST_PARSED, onReady);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            toast({ title: "Playback error", description: "Could not load HLS stream.", variant: "destructive" });
          }
        });
      } else {
        // Safari supports HLS natively, or non-HLS source
        video.onloadedmetadata = onReady;
        video.oncanplay = onReady;
        video.src = url;
        video.load();
      }

      const handleTimeUpdate = () => {
        if (moment?.clip_end && moment?.clip_start != null && video.currentTime >= Math.max(1, moment.clip_end - moment.clip_start)) {
          video.pause();
          musicRef.current?.pause();
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        musicRef.current?.pause();
        if (hls) hls.destroy();
        video.onloadedmetadata = null;
        video.oncanplay = null;
      };
    } else {
      musicRef.current?.pause();
    }
  }, [previewClip, moments, branding.musicTrackUrl]);

  // Group clips by derived label (recipient + category) so the three sibling
  // formats appear together. Never show "AI did not capture a clear moment".
  const clipsByWinner = clips.reduce((acc, clip) => {
    const { winner, category } = deriveClipLabel(clip, categoryById, momentById);
    const key = `${winner}|${category}`;
    if (!acc[key]) acc[key] = { winnerName: winner, category, clips: [] };
    acc[key].clips.push(clip);
    return acc;
  }, {} as Record<string, { winnerName: string; category: string; clips: Clip[] }>);

  const statusCounts = {
    queued: clips.filter((c) => c.status === "queued").length,
    processing: clips.filter((c) => c.status === "processing").length,
    ready: clips.filter((c) => c.status === "ready").length,
    delivered: clips.filter((c) => c.status === "delivered").length,
  };

  const handleDownload = async (clip: Clip) => {
    const url = getDownloadUrl(clip);
    if (!url) {
      toast({
        title: "Clip not ready",
        description: "AI is still generating this clip. Check back when its status is Ready.",
        variant: "destructive",
      });
      return;
    }
    setDownloadingId(clip.id);
    const filename = `${clip.winner_name.replace(/\s+/g, "_")}-${clip.format}.mp4`;
    await downloadClipAsBlob(url, filename, clip.id);
    setDownloadingId(null);
    setDownloadedId(clip.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  /**
   * Download a branded copy by burning logo + colors + music into the MP4
   * client-side via canvas + MediaRecorder. Works for clips up to ~3 min.
   */
  const handleDownloadBranded = async (
    clip: Clip,
    formatOverride?: "horizontal" | "square" | "vertical"
  ) => {
    const url = getDownloadUrl(clip);
    if (!url) {
      toast({ title: "Clip not ready", variant: "destructive" });
      return;
    }
    if (!branding.appliedAt && !branding.logoUrl) {
      toast({
        title: "No branding configured",
        description: "Set your logo and colors in Branding first.",
        variant: "destructive",
      });
      return;
    }
    const targetFormat: "horizontal" | "square" | "vertical" =
      formatOverride ||
      ((clip.format === "vertical" || clip.format === "square") ? clip.format : "horizontal");
    setDownloadingId(clip.id);
    toast({ title: `Burning ${targetFormat} branded clip…`, description: "This may take up to a minute." });
    try {
      const { winner, category } = deriveClipLabel(clip, categoryById, momentById);
      const resolvedSourceUrl = await resolveDownloadUrl(url, (message) => {
        toast({ title: "Preparing source video", description: message });
      });
      const blob = await burnInBrandedClip({
        sourceUrl: resolvedSourceUrl,
        branding,
        winnerName: winner,
        category,
        format: targetFormat,
      });
      const objectUrl = URL.createObjectURL(blob);
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${clip.winner_name.replace(/\s+/g, "_")}-${targetFormat}-branded.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      if (ext === "webm") {
        toast({
          title: "Branded clip ready (WebM)",
          description: "Your browser doesn't support MP4 export. WebM plays in Chrome, VLC, and most editors. For QuickTime, use 'Download Raw MP4'.",
        });
      } else {
        toast({ title: "Branded MP4 ready", description: "Logo, colors and music burned in." });
      }
    } catch (e) {
      toast({
        title: "Burn-in failed",
        description: e instanceof Error ? e.message : "Try again or download the raw clip.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
      setDownloadedId(clip.id);
      setTimeout(() => setDownloadedId(null), 2000);
    }
  };


  const handleDownloadAll = async () => {
    const readyClips = clips.filter(c => (c.status === "ready" || c.status === "delivered") && getDownloadUrl(c));
    if (readyClips.length === 0) {
      toast({ title: "Nothing to download", description: "No approved clips are ready yet." });
      return;
    }
    try {
      toast({ title: "Bundling clips…", description: `Zipping ${readyClips.length} clips. This can take a moment.` });
      const { data, error } = await supabase.functions.invoke("zip-clips", {
        body: { clipIds: readyClips.map(c => c.id) },
      });
      if (error) throw error;
      const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `awardscut-clips-${Date.now()}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "Download ready", description: `${readyClips.length} clips zipped.` });
    } catch (e) {
      // Fallback: per-file download via existing helper
      const items = readyClips.map(c => ({
        url: getDownloadUrl(c)!,
        filename: `${c.winner_name.replace(/\s+/g, "_")}-${c.format}.mp4`,
        id: c.id,
      }));
      await downloadAllClips(items, toast);
    }
  };

  const handleCopyLink = (clip: Clip) => {
    const url = getPlayableUrl(clip) || `https://awardscut.com/clips/${clip.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Video URL copied to clipboard." });
  };

  const openShareModal = (clip: Clip) => { setSelectedClip(clip); setShareModalOpen(true); };

  const handleShare = (platform: string) => {
    if (!selectedClip) return;
    const shareUrl = getPlayableUrl(selectedClip) || `https://awardscut.com/clips/${selectedClip.id}`;
    const shareText = `Check out this award moment from Awardscut`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    let target = "";
    switch (platform) {
      case "Twitter/X":
        target = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "Facebook":
        target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "LinkedIn":
        target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "Instagram":
        // Instagram has no public web share intent — copy link + open instagram.com
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied for Instagram", description: "Paste it into your Instagram post or story." });
        target = `https://www.instagram.com/`;
        break;
      case "TikTok":
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied for TikTok", description: "Paste it into your TikTok caption." });
        target = `https://www.tiktok.com/upload`;
        break;
      default:
        target = shareUrl;
    }

    window.open(target, "_blank", "noopener,noreferrer");
    setShareModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      queued: "bg-muted text-muted-foreground",
      processing: "bg-primary/20 text-primary",
      failed: "bg-destructive/20 text-destructive",
      ready: "bg-green-500/20 text-green-500",
      delivered: "bg-blue-500/20 text-blue-500",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.queued}`}>{status}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CeremonySelector />
        <SetupStepper />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clip Generation</h1>
            <p className="text-muted-foreground">AI-generated winner clips with real video playback.</p>
          </div>
          <div className="flex gap-2">
            {clips.filter(c => c.status === "ready" || c.status === "delivered").length > 1 && (
              <Button variant="hero" size="sm" onClick={handleDownloadAll}>
                <Download className="h-4 w-4" /> Download All Approved
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Queued", count: statusCounts.queued, color: "text-muted-foreground" },
            { label: "Processing", count: statusCounts.processing, color: "text-primary" },
            { label: "Ready", count: statusCounts.ready, color: "text-green-500" },
            { label: "Delivered", count: statusCounts.delivered, color: "text-blue-500" },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && clips.length === 0 && <ClipPipelineGuide />}

        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(clipsByWinner).map(([key, { winnerName, category, clips: winnerClips }]) => (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{winnerName}</h3>
                    <p className="text-sm text-muted-foreground">{category}</p>
                  </div>
                  {winnerClips.every((c) => c.status === "ready" || c.status === "delivered") && (
                    <Button variant="secondary" size="sm" onClick={() => openShareModal(winnerClips[0])}>
                      <Share2 className="h-4 w-4" /> Share All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {winnerClips.map((clip) => (
                    <div key={clip.id} className="group p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/40 hover:bg-muted/60 hover:-translate-y-0.5 transition-all duration-200">
                      <div
                        className={`relative rounded-lg overflow-hidden mb-3 flex items-center justify-center cursor-pointer transition-shadow group-hover:shadow-lg ${
                          clip.format === "vertical" ? "aspect-[9/16] max-h-56" : clip.format === "square" ? "aspect-square max-h-56" : "aspect-video"
                        }`}
                        style={{
                          background: templateBackdrop(branding),
                          border: `2px solid ${branding.primaryColor}66`,
                        }}
                        onClick={() => (clip.status === "ready" || clip.status === "delivered") && setPreviewClip(clip)}
                      >
                        {clip.status === "ready" || clip.status === "delivered" ? (
                          <Play className="h-8 w-8" style={{ color: branding.primaryColor }} />
                        ) : clip.status === "processing" ? (
                          <Loader2 className="h-8 w-8 animate-spin" style={{ color: branding.primaryColor }} />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                        {branding.logoUrl && (clip.status === "ready" || clip.status === "delivered") && (
                          <img
                            src={branding.logoUrl}
                            alt=""
                            className={`absolute ${logoPlacementClass(branding.logoPlacement)} h-5 w-auto max-w-[40px] object-contain drop-shadow pointer-events-none`}
                          />
                        )}
                        {branding.appliedAt && (
                          <span
                            className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded text-white pointer-events-none"
                            style={{ backgroundColor: branding.primaryColor }}
                          >
                            BRANDED
                          </span>
                        )}
                        {(clip.status === "ready" || clip.status === "delivered") && (
                          <div
                            className={`absolute inset-x-0 bottom-0 px-2 py-1.5 pointer-events-none flex flex-col ${textLayoutClass(branding.textLayout)}`}
                            style={{
                              background: `linear-gradient(to top, ${branding.primaryColor}ee, transparent)`,
                              fontFamily: branding.fontFamily,
                            }}
                          >
                            <div className="text-[11px] font-bold text-white leading-tight truncate">{winnerName}</div>
                            <div className="text-[9px] text-white/85 leading-tight truncate">{category}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{clip.format_label}</span>
                        {getStatusBadge(clip.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{clip.dimensions} · {clip.duration_label}</p>

                      {/* Premium two-row action grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="hero"
                              size="sm"
                              disabled={downloadingId === clip.id || (clip.status !== "ready" && clip.status !== "delivered")}
                              className="col-span-2 w-full"
                            >
                              {downloadingId === clip.id ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Burning…</>
                              ) : downloadedId === clip.id ? (
                                <><Check className="h-4 w-4" /> Saved</>
                              ) : (
                                <><Sparkles className="h-4 w-4" /> Download <ChevronDown className="h-3 w-3 ml-1" /></>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
                            <DropdownMenuLabel>Branded (logo + template)</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDownloadBranded(clip, "horizontal")}>
                              <Sparkles className="h-4 w-4" /> 16:9 Landscape
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadBranded(clip, "square")}>
                              <Sparkles className="h-4 w-4" /> 1:1 Square
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadBranded(clip, "vertical")}>
                              <Sparkles className="h-4 w-4" /> 9:16 Vertical
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Raw (original MP4)</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDownload(clip)}>
                              <Download className="h-4 w-4" /> Raw MP4 — plays in QuickTime
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="secondary" size="sm" onClick={() => setPreviewClip(clip)} disabled={clip.status !== "ready" && clip.status !== "delivered"}>
                          <Play className="h-4 w-4" /> Preview
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openShareModal(clip)} disabled={clip.status !== "ready" && clip.status !== "delivered"}>
                          <Share2 className="h-4 w-4" /> Share
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(clip)} disabled={!getPlayableUrl(clip)} className="col-span-2">
                          <Copy className="h-4 w-4" /> Copy Link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!previewClip} onOpenChange={() => setPreviewClip(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{previewClip ? (() => { const l = deriveClipLabel(previewClip, categoryById, momentById); return `${l.winner} — ${l.category}`; })() : ""}</DialogTitle>
            <DialogDescription>{previewClip?.format_label} · {previewClip?.dimensions} · {previewClip?.duration_label}</DialogDescription>
          </DialogHeader>
          <div
            className={`relative rounded-xl overflow-hidden p-3 ${previewAspectClass(previewClip?.format)}`}
            style={{ boxShadow: `0 0 0 3px ${branding.primaryColor}`, background: templateBackdrop(branding) }}
          >
            <video ref={videoRef} controls playsInline preload="auto" crossOrigin="anonymous" className="w-full h-[calc(100%-5.5rem)] rounded-lg object-contain bg-black border border-border/40" />
            {isUsableAssetUrl(branding.logoUrl) && (
              <img
                src={branding.logoUrl!}
                alt="Brand logo"
                className={`absolute ${logoPlacementClass(branding.logoPlacement)} h-10 w-auto max-w-[120px] object-contain drop-shadow-lg pointer-events-none`}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            )}
            <div
              className={`absolute bottom-0 left-0 right-0 min-h-[5.25rem] px-4 py-3 text-sm font-semibold text-white pointer-events-none flex flex-col justify-center ${textLayoutClass(branding.textLayout)}`}
              style={{
                background: `linear-gradient(to top, ${branding.primaryColor}cc, transparent)`,
                fontFamily: branding.fontFamily,
              }}
            >
              {previewClip ? (() => { const l = deriveClipLabel(previewClip, categoryById, momentById); return `${l.winner} • ${l.category}`; })() : ""}
            </div>
          </div>
          {previewClip && !getPlayableUrl(previewClip) && (
            <p className="text-xs text-muted-foreground -mt-2">This clip is still being generated by AI — preview will be available once it's ready.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => previewClip && handleDownload(previewClip)}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="secondary" onClick={() => previewClip && handleCopyLink(previewClip)}>
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
            <Button variant="hero" onClick={() => { if (previewClip) openShareModal(previewClip); setPreviewClip(null); }}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share Clip</DialogTitle>
            <DialogDescription>Download or copy link to post. Connect social accounts in Settings for one-click posting.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button variant="secondary" onClick={() => handleShare("Instagram")}><Instagram className="h-5 w-5" /> Instagram</Button>
            <Button variant="secondary" onClick={() => handleShare("TikTok")}><ExternalLink className="h-5 w-5" /> TikTok</Button>
            <Button variant="secondary" onClick={() => handleShare("LinkedIn")}><Linkedin className="h-5 w-5" /> LinkedIn</Button>
            <Button variant="secondary" onClick={() => handleShare("Facebook")}><Facebook className="h-5 w-5" /> Facebook</Button>
            <Button variant="secondary" onClick={() => handleShare("Twitter/X")}><Twitter className="h-5 w-5" /> X (Twitter)</Button>
            <Button variant="secondary" onClick={() => selectedClip && handleCopyLink(selectedClip)}><Copy className="h-5 w-5" /> Copy Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
