"use client";

import { useState, useEffect, useRef } from "react";
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
  Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { downloadClipAsBlob, downloadAllClips } from "@/lib/clipDownload";

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
  created_at: string;
  updated_at: string;
}

interface Moment {
  id: string;
  clip_start: number | null;
  clip_end: number | null;
}

export default function ClipGeneration() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('clip-generation-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_clips' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setClips(prev => prev.map(c => c.id === (payload.new as Clip).id ? payload.new as Clip : c));
        } else if (payload.eventType === 'INSERT') {
          setClips(prev => {
            if (prev.find(c => c.id === (payload.new as Clip).id)) return prev;
            return [payload.new as Clip, ...prev];
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

    const [clipsRes, momentsRes] = await Promise.all([
      supabase.from('generated_clips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('detected_moments').select('id, clip_start, clip_end').eq('user_id', user.id),
    ]);

    if (clipsRes.data) setClips(clipsRes.data as any);
    if (momentsRes.data) setMoments(momentsRes.data as any);
    setLoading(false);
  };

  const getMoment = (momentId: string | null) => moments.find(m => m.id === momentId);

  useEffect(() => {
    if (previewClip && videoRef.current && previewClip.source_video_url) {
      const video = videoRef.current;
      const moment = getMoment(previewClip.moment_id);
      video.src = previewClip.source_video_url;
      video.load();
      video.onloadedmetadata = () => {
        video.currentTime = moment?.clip_start || 0;
        video.play().catch(() => {});
      };
      const handleTimeUpdate = () => {
        if (moment?.clip_end && video.currentTime >= moment.clip_end) {
          video.pause();
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [previewClip, moments]);

  const clipsByWinner = clips.reduce((acc, clip) => {
    const key = `${clip.winner_name}-${clip.category}`;
    if (!acc[key]) acc[key] = { winnerName: clip.winner_name, category: clip.category, clips: [] };
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
    if (!clip.source_video_url) {
      toast({ title: "No video source", description: "Video URL not available for this clip.", variant: "destructive" });
      return;
    }
    setDownloadingId(clip.id);
    const filename = `${clip.winner_name.replace(/\s+/g, "_")}-${clip.format}.mp4`;
    await downloadClipAsBlob(clip.source_video_url, filename);
    setDownloadingId(null);
    setDownloadedId(clip.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  const handleDownloadAll = async () => {
    const readyClips = clips.filter(c => (c.status === "ready" || c.status === "delivered") && c.source_video_url);
    const items = readyClips.map(c => ({
      url: c.source_video_url!,
      filename: `${c.winner_name.replace(/\s+/g, "_")}-${c.format}.mp4`,
      id: c.id,
    }));
    await downloadAllClips(items, toast);
  };

  const handleCopyLink = (clip: Clip) => {
    const url = clip.source_video_url || `https://awardscut.com/clips/${clip.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Video URL copied to clipboard." });
  };

  const openShareModal = (clip: Clip) => { setSelectedClip(clip); setShareModalOpen(true); };

  const handleShare = (platform: string) => {
    setShareModalOpen(false);
    toast({ title: "Share ready", description: `Download or copy link to post on ${platform}. Connect social accounts in Settings for one-click posting.` });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      queued: "bg-muted text-muted-foreground",
      processing: "bg-primary/20 text-primary",
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
              <Button variant="secondary" size="sm" onClick={handleDownloadAll}>
                <Download className="h-4 w-4" /> Download All
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

        {!loading && clips.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-2xl bg-card border border-border/50">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">No clips yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload a video on the Livestream Manager page. AI will detect moments and generate clips that appear here.
            </p>
          </motion.div>
        )}

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
                    <div key={clip.id} className="p-4 rounded-xl bg-muted/50 border border-border/30">
                      <div
                        className={`relative rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mb-3 flex items-center justify-center cursor-pointer ${
                          clip.format === "vertical" ? "aspect-[9/16] max-h-32" : clip.format === "square" ? "aspect-square max-h-32" : "aspect-video max-h-32"
                        }`}
                        onClick={() => (clip.status === "ready" || clip.status === "delivered") && setPreviewClip(clip)}
                      >
                        {clip.status === "ready" || clip.status === "delivered" ? (
                          <Play className="h-8 w-8 text-primary" />
                        ) : clip.status === "processing" ? (
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{clip.format_label}</span>
                        {getStatusBadge(clip.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{clip.dimensions} · {clip.duration_label}</p>

                      {/* Always-visible action buttons for ready clips */}
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreviewClip(clip)} disabled={clip.status !== "ready" && clip.status !== "delivered"}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <button
                          onClick={() => handleDownload(clip)}
                          disabled={downloadingId === clip.id || (!clip.source_video_url)}
                          className="flex-1 h-9 rounded-md bg-muted border border-border flex items-center justify-center gap-1 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === clip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : downloadedId === clip.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleCopyLink(clip)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => openShareModal(clip)}>
                          <Share2 className="h-4 w-4" />
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
            <DialogTitle className="text-foreground">{previewClip?.winner_name} — {previewClip?.category}</DialogTitle>
            <DialogDescription>{previewClip?.format_label} · {previewClip?.dimensions} · {previewClip?.duration_label}</DialogDescription>
          </DialogHeader>
          <div className="aspect-video rounded-xl bg-black overflow-hidden">
            {previewClip?.source_video_url ? (
              <video ref={videoRef} controls className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <p>No video source available</p>
              </div>
            )}
          </div>
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
