"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MonitorPlay, Play, Square, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLivestreamStore } from "@/stores/livestreamStore";
import { useClipPipeline } from "@/hooks/useClipPipeline";

export function ScreenCaptureMode() {
  const store = useLivestreamStore();
  const pipeline = useClipPipeline();
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isCapturing = store.connectionStatus === "live" && store.mode === "screen";

  useEffect(() => {
    if (videoRef.current && store.screenStream) {
      videoRef.current.srcObject = store.screenStream;
    }
    return () => { if (videoRef.current) videoRef.current.srcObject = null; };
  }, [store.screenStream]);

  const handleStart = async () => {
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast({ title: "Not supported", description: "Screen capture not supported in this browser.", variant: "destructive" });
        setStarting(false);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: true,
      });

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        store.setScreenStream(null);
        store.setConnectionStatus("disconnected");
        store.resetTimer();
      });

      store.setScreenStream(stream);
      store.setConnectionStatus("live");
      store.startStreamTimer();
      pipeline.startPipeline("screen-capture-live.mp4", undefined, {
        detectionInterval: store.detectionInterval,
        clipDuration: store.clipDuration,
        autoClipGeneration: store.autoClip,
      });
      toast({ title: "🔴 Capturing", description: "Screen capture + AI detection started." });
    } catch {
      toast({ title: "Cancelled", description: "Screen capture was cancelled.", variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    if (store.screenStream) {
      store.screenStream.getTracks().forEach((t) => t.stop());
      store.setScreenStream(null);
    }
    store.setConnectionStatus("disconnected");
    store.resetTimer();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MonitorPlay className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Screen Capture</h2>
          <p className="text-sm text-muted-foreground">Capture directly from your browser</p>
        </div>
      </div>

      {isCapturing && store.screenStream ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-charcoal border border-border/50">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-contain bg-black" />
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-green-600/90 text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
            </div>
          </div>
          <Button variant="destructive" className="w-full" onClick={handleStop}>
            <Square className="h-5 w-5" /> Stop Capture
          </Button>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-muted/50 border border-border/30 text-center">
          <MonitorPlay className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-1">Browser-Based Capture</p>
          <p className="text-sm text-muted-foreground mb-6">Share your screen or a specific window to capture the ceremony feed.</p>
          <Button variant="hero" className="w-full" onClick={handleStart} disabled={starting}>
            {starting ? <><Loader2 className="h-5 w-5 animate-spin" /> Starting…</> : <><Play className="h-5 w-5" /> Start Screen Capture</>}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
