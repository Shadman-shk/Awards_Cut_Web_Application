"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useLivepeerStream } from "@/hooks/useLivepeerStream";
import { useLivestreamStore } from "@/stores/livestreamStore";
import { useClipPipeline } from "@/hooks/useClipPipeline";
import {
  Radio, Play, Square, Copy, Wifi, Loader2, Eye, EyeOff,
  AlertTriangle, XCircle, RefreshCw, Trash2, Plus, CheckCircle2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export function RTMPMode() {
  const store = useLivestreamStore();
  const livepeer = useLivepeerStream();
  const pipeline = useClipPipeline();
  const { canRevealStreamKey } = useUserRole();

  const [showStreamKey, setShowStreamKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  // Sync Livepeer status → store connectionStatus
  useEffect(() => {
    if (livepeer.livepeerStatus === "creating") store.setConnectionStatus("connecting");
    else if (livepeer.livepeerStatus === "active") {
      store.setConnectionStatus("live");
      store.startStreamTimer();
      if (!pipeline.isScanning) {
        pipeline.startPipeline("rtmp-live-stream.mp4", undefined, {
          detectionInterval: store.detectionInterval,
          clipDuration: store.clipDuration,
          autoClipGeneration: store.autoClip,
        });
      }
    } else if (livepeer.livepeerStatus === "ready") store.setConnectionStatus("connected");
    else if (livepeer.livepeerStatus === "error") {
      store.setConnectionStatus("error");
      setErrorMessage(livepeer.error || "Connection error");
    } else store.setConnectionStatus("disconnected");
  }, [livepeer.livepeerStatus, livepeer.error]);

  // Sync streamData to store
  useEffect(() => {
    if (livepeer.streamData) {
      store.setStreamData({
        id: livepeer.streamData.stream_id,
        streamKey: livepeer.streamData.stream_key,
        rtmpUrl: livepeer.streamData.rtmps_url || livepeer.streamData.rtmp_url,
        playbackId: livepeer.streamData.playback_id || "",
        playbackUrl: livepeer.streamData.playback_id
          ? `https://livepeercdn.studio/hls/${livepeer.streamData.playback_id}/index.m3u8`
          : "",
        isActive: livepeer.livepeerStatus === "active",
      });
    } else {
      store.setStreamData(null);
    }
  }, [livepeer.streamData, livepeer.livepeerStatus]);

  // Poll when stream exists
  useEffect(() => {
    if (livepeer.livepeerStatus === "ready" || livepeer.livepeerStatus === "active") {
      livepeer.startPolling();
    }
    return () => livepeer.stopPolling();
  }, [livepeer.livepeerStatus]);

  const copyToClipboard = (text: string, label: string) => {
    if (label === "Stream key" && !canRevealStreamKey) {
      setPermissionModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const toggleStreamKeyVisibility = () => {
    if (!canRevealStreamKey) { setPermissionModalOpen(true); return; }
    setShowStreamKey(!showStreamKey);
  };

  const handleCreate = async () => {
    setErrorMessage(null);
    await livepeer.createStream();
  };

  const handleDisconnect = async () => {
    await livepeer.deleteStream();
    store.setConnectionStatus("disconnected");
    store.resetTimer();
  };

  const handleStartMonitoring = () => {
    store.setConnectionStatus("live");
    store.startStreamTimer();
    pipeline.startPipeline("rtmp-live-stream.mp4", undefined, {
      detectionInterval: store.detectionInterval,
      clipDuration: store.clipDuration,
      autoClipGeneration: store.autoClip,
    });
    toast({ title: "🔴 Stream Live", description: "AI detection started." });
  };

  const handleStopMonitoring = () => {
    store.setConnectionStatus("connected");
    store.resetTimer();
  };

  const hasStream = !!livepeer.streamData;
  const isConnecting = store.connectionStatus === "connecting";
  const isConnected = store.connectionStatus === "connected";
  const isLive = store.connectionStatus === "live";

  const rtmpUrl = store.streamData?.rtmpUrl || "";
  const streamKey = store.streamData?.streamKey || "";
  const playbackId = store.streamData?.playbackId || "";

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">RTMP Connection</h2>
              <p className="text-sm text-muted-foreground">Connect OBS or any encoder via Livepeer RTMP</p>
            </div>
          </div>
          {hasStream && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isLive ? "bg-green-500/20 text-green-500" :
              isConnected ? "bg-yellow-500/20 text-yellow-500" :
              "bg-muted text-muted-foreground"
            }`}>
              {isLive ? <><CheckCircle2 className="h-3 w-3" /> Receiving</> :
               isConnected ? <><Wifi className="h-3 w-3" /> Waiting for encoder</> :
               "Idle"}
            </span>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="h-6 w-6 p-0 text-destructive"><XCircle className="h-4 w-4" /></Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create stream */}
        {!hasStream && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border/30 text-center">
            <p className="text-sm text-muted-foreground mb-3">Create a Livepeer live stream to get your RTMP ingest credentials.</p>
            <Button variant="hero" onClick={handleCreate} disabled={isConnecting}>
              {isConnecting ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating stream…</> : <><Plus className="h-5 w-5" /> Create Live Stream</>}
            </Button>
          </div>
        )}

        {/* Credentials */}
        {hasStream && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">OBS / Encoder Settings</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Protocol</span><p className="text-foreground mt-0.5 font-medium">RTMP (Livepeer)</p></div>
                <div><span className="text-muted-foreground">Recommended</span><p className="text-foreground mt-0.5">x264 · 4500 kbps · 1080p</p></div>
              </div>
            </div>

            {/* RTMP URL */}
            <div>
              <Label className="text-muted-foreground mb-2 block">RTMP Server URL</Label>
              <div className="flex gap-2">
                <Input value={rtmpUrl} readOnly className="bg-muted border-border/50 font-mono text-sm" />
                <Button variant="secondary" onClick={() => copyToClipboard(rtmpUrl, "RTMP URL")}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Stream Key */}
            <div>
              <Label className="text-muted-foreground mb-2 block">Stream Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input value={streamKey} readOnly type={showStreamKey ? "text" : "password"} className="bg-muted border-border/50 font-mono text-sm pr-10" />
                  <button type="button" onClick={toggleStreamKeyVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="secondary" onClick={() => copyToClipboard(streamKey, "Stream key")}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>

            {playbackId && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/20 text-xs">
                <span className="text-muted-foreground">Playback ID: </span>
                <span className="font-mono text-foreground">{playbackId}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              {isConnected && !isLive ? (
                <>
                  <Button variant="hero" className="flex-1" onClick={handleStartMonitoring}><Play className="h-5 w-5" /> Start Monitoring</Button>
                  <Button variant="secondary" size="icon" onClick={() => livepeer.resetKey()} title="Reset stream key"><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="secondary" size="icon" onClick={handleDisconnect} title="Delete stream"><Trash2 className="h-4 w-4" /></Button>
                </>
              ) : isLive ? (
                <>
                  <Button variant="destructive" className="flex-1" onClick={handleStopMonitoring}><Square className="h-5 w-5" /> Stop Monitoring</Button>
                  <Button variant="secondary" size="icon" onClick={handleDisconnect} title="Delete stream"><Trash2 className="h-4 w-4" /></Button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Permission Denied</DialogTitle>
            <DialogDescription>Only Owner and Admin roles can reveal the stream key.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end py-4">
            <Button variant="secondary" onClick={() => setPermissionModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}