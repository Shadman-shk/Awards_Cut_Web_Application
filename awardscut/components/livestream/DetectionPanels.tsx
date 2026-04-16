"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap, Scissors, Video, Eye, CheckCircle2, Loader2, XCircle,
  Play, Download, Share2, Copy, Mail, MessageCircle, Twitter, Linkedin, X,
  Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
// Mock implementation for clip download - replace with actual implementation when backend is ready
const downloadClipAsBlob = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

const downloadAllClips = async (items: Array<{url: string, filename: string, id: string}>, toast: any) => {
  for (const item of items) {
    try {
      await downloadClipAsBlob(item.url, item.filename);
      toast({ title: "Downloaded", description: `${item.filename} downloaded successfully.` });
    } catch (error) {
      toast({ title: "Download failed", description: `Failed to download ${item.filename}.`, variant: "destructive" });
    }
  }
};

export interface DetectedMoment {
  id: string;
  timestamp: string;
  type: string;
  confidence: number;
  clipGenerated: boolean;
  winnerName?: string;
  category?: string;
  sourceVideoUrl?: string;
  clipStart?: number;
  clipEnd?: number;
}

export interface GeneratedClip {
  id: string;
  momentId: string;
  timestamp: string;
  duration: number;
  winner?: string;
  category?: string;
  status: "generating" | "ready" | "failed";
  format?: string;
  sourceVideoUrl?: string;
}

interface DetectionPanelsProps {
  detectedMoments: DetectedMoment[];
  generatedClips: GeneratedClip[];
  onManualClip: (moment: DetectedMoment) => void;
}

export function DetectionPanels({ detectedMoments, generatedClips, onManualClip }: DetectionPanelsProps) {
  const [previewClip, setPreviewClip] = useState<GeneratedClip | null>(null);
  const [shareClip, setShareClip] = useState<GeneratedClip | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getMomentForClip = (clip: GeneratedClip) => {
    return detectedMoments.find(m => m.id === clip.momentId);
  };

  useEffect(() => {
    if (previewClip && videoRef.current && previewClip.sourceVideoUrl) {
      const moment = getMomentForClip(previewClip);
      const video = videoRef.current;
      video.src = previewClip.sourceVideoUrl;
      video.load();
      video.onloadedmetadata = () => {
        video.currentTime = moment?.clipStart || 0;
        video.play().catch(() => {});
      };
      const handleTimeUpdate = () => {
        if (moment?.clipEnd && video.currentTime >= moment.clipEnd) {
          video.pause();
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [previewClip, detectedMoments]);

  const handleDownload = async (clip: GeneratedClip) => {
    if (!clip.sourceVideoUrl) {
      toast({ title: "No video available", description: "Source video URL not found.", variant: "destructive" });
      return;
    }
    setDownloadingId(clip.id);
    const filename = `${clip.category || "clip"}-${clip.winner || "award"}-${clip.format?.replace(/[^a-zA-Z0-9]/g, '') || "clip"}.mp4`;
    await downloadClipAsBlob(clip.sourceVideoUrl, filename);
    setDownloadingId(null);
    setDownloadedId(clip.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  const handleDownloadAll = async () => {
    const readyClips = generatedClips.filter(c => c.status === "ready" && c.sourceVideoUrl);
    const items = readyClips.map(c => ({
      url: c.sourceVideoUrl!,
      filename: `${c.category || "clip"}-${c.winner || "award"}-${c.format?.replace(/[^a-zA-Z0-9]/g, '') || "clip"}.mp4`,
      id: c.id,
    }));
    await downloadAllClips(items, toast);
  };

  const handleCopyLink = (clip: GeneratedClip) => {
    const url = clip.sourceVideoUrl || `https://awardscut.com/clips/${clip.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Video URL copied to clipboard." });
  };

  const handleShare = (platform: string) => {
    setShareClip(null);
    toast({ title: "Share ready", description: `Download or copy link to post on ${platform}.` });
  };

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Detected Moments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">AI Detection</h2>
                <p className="text-sm text-muted-foreground">Real AI moment detection</p>
              </div>
            </div>
            {detectedMoments.length > 0 && (
              <div className="flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-500">{detectedMoments.length} MOMENTS</span>
              </div>
            )}
          </div>

          {detectedMoments.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-charcoal/50 border border-border/30 max-h-20 overflow-y-auto font-mono text-xs text-muted-foreground space-y-1">
              {detectedMoments.slice(0, 5).map((m) => (
                <motion.p key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="text-green-500">[{m.timestamp}]</span>{" "}
                  {m.winnerName ? `Award: ${m.category} — Winner: ${m.winnerName}` : `${m.type} (${m.confidence}%)`}
                </motion.p>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            <AnimatePresence>
              {detectedMoments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No moments detected yet</p>
                  <p className="text-xs">Upload a video to detect award moments</p>
                </div>
              ) : (
                detectedMoments.map((moment, i) => (
                  <motion.div key={moment.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-xl bg-muted/50 border border-border/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {moment.winnerName ? `${moment.category} — ${moment.winnerName}` : moment.type}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{moment.timestamp}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${moment.confidence}%` }} />
                          </div>
                          <span className="text-green-500">{moment.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    {moment.clipGenerated ? (
                      <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Clipped
                      </span>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => onManualClip(moment)} className="text-xs">
                        <Scissors className="h-3 w-3 mr-1" /> Clip
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Generated Clips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Generated Clips</h2>
                <p className="text-sm text-muted-foreground">Auto-generated award clips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {generatedClips.filter((c) => c.status === "ready").length} ready
              </span>
              {generatedClips.filter(c => c.status === "ready").length > 1 && (
                <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={handleDownloadAll}>
                  <Download className="h-3 w-3" /> All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            <AnimatePresence>
              {generatedClips.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No clips generated yet</p>
                  <p className="text-xs">Clips appear after AI detects moments</p>
                </div>
              ) : (
                generatedClips.map((clip, i) => (
                  <motion.div key={clip.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }} className="p-3 rounded-xl bg-muted/50 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                        {clip.status === "ready" ? <Play className="h-4 w-4 text-primary" /> : clip.status === "generating" ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{clip.category} — {clip.winner}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{clip.format}</span>
                          <span>•</span>
                          <span>~{clip.duration}s</span>
                        </div>
                      </div>
                      {/* Always-visible action buttons */}
                      {clip.status === "ready" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewClip(clip)} title="Play">
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <button
                            onClick={() => handleDownload(clip)}
                            disabled={downloadingId === clip.id}
                            className="h-9 w-9 rounded-md bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                            title="Download"
                          >
                            {downloadingId === clip.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : downloadedId === clip.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShareClip(clip)} title="Share">
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {clip.status === "generating" && (
                        <span className="text-xs text-yellow-500 font-medium flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                      {clip.status === "failed" && (
                        <span className="text-xs text-destructive font-medium">Failed</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewClip} onOpenChange={() => setPreviewClip(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {previewClip?.category} — {previewClip?.winner}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{previewClip?.format} · ~{previewClip?.duration}s</p>
          <div className="aspect-video rounded-xl bg-black overflow-hidden">
            {previewClip?.sourceVideoUrl ? (
              <video ref={videoRef} controls className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <p>No video source available</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {previewClip?.format} · ~{previewClip?.duration}s
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => previewClip && handleDownload(previewClip)}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="hero" onClick={() => { setPreviewClip(null); if (previewClip) setShareClip(previewClip); }}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={!!shareClip} onOpenChange={() => setShareClip(null)}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share Clip</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{shareClip?.category} — {shareClip?.winner}</p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={() => handleShare("SMS")}><MessageCircle className="h-4 w-4" /> SMS</Button>
            <Button variant="secondary" onClick={() => handleShare("Email")}><Mail className="h-4 w-4" /> Email</Button>
            <Button variant="secondary" onClick={() => handleShare("Twitter/X")}><Twitter className="h-4 w-4" /> X (Twitter)</Button>
            <Button variant="secondary" onClick={() => handleShare("LinkedIn")}><Linkedin className="h-4 w-4" /> LinkedIn</Button>
          </div>
          <Button variant="ghost" className="w-full mt-2" onClick={() => { if (shareClip) handleCopyLink(shareClip); setShareClip(null); }}>
            <Copy className="h-4 w-4" /> Copy Link
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}