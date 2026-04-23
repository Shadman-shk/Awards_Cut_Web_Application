"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Video, Radio, Loader2, CheckCircle2, AlertCircle, XCircle,
  Volume2, VolumeX, Maximize, RotateCcw, Zap, Scan,
} from "lucide-react";
import { useLivestreamStore } from "@/stores/livestreamStore";
import { HLSPlayer } from "./HLSPlayer";
import { FaceDetectionOverlay } from "./FaceDetectionOverlay";
import { StreamStatsOverlay } from "./StreamStatsOverlay";

interface StreamPreviewProps {
  formatTime: (s: number) => string;
}

export function StreamPreview({ formatTime }: StreamPreviewProps) {
  const {
    mode, connectionStatus, streamData, uploadedObjectUrl,
    screenStream, elapsedSeconds, isMuted, toggleMute, isDetecting,
    detectedMoments, setConnectionStatus,
  } = useLivestreamStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsVideoEl, setHlsVideoEl] = useState<HTMLVideoElement | null>(null);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(false);

  const isLive = connectionStatus === "live";
  const isConnecting = connectionStatus === "connecting";
  const isConnected = connectionStatus === "connected";

  // Attach screen stream
  useEffect(() => {
    if (videoRef.current && screenStream && mode === "screen") {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, mode]);

  const hasHLS = mode === "rtmp" && streamData?.playbackId && (isLive || isConnected);
  const hasScreen = mode === "screen" && screenStream && isLive;
  const hasUpload = mode === "upload" && uploadedObjectUrl && (isConnected || isLive);
  const hasAnyVideo = hasHLS || hasScreen || hasUpload;

  const activeVideoEl = hasHLS ? hlsVideoEl : hasScreen ? videoRef.current : null;
  const detectedCount = detectedMoments.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Stream Preview</h2>
            <p className="text-sm text-muted-foreground">Live feed from your stream</p>
          </div>
        </div>
        {hasAnyVideo && (
          <div className="flex items-center gap-2">
            <Button variant={faceDetectionEnabled ? "default" : "ghost"} size="icon" onClick={() => setFaceDetectionEnabled(!faceDetectionEnabled)} className="h-8 w-8" title="Toggle face detection">
              <Scan className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Maximize className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      <div className="aspect-video rounded-xl bg-charcoal border border-border/50 relative overflow-hidden">
        {/* HLS */}
        {hasHLS && (
          <HLSPlayer playbackId={streamData!.playbackId} muted={isMuted} className="absolute inset-0 w-full h-full object-contain" onVideoElement={setHlsVideoEl} />
        )}

        {/* Screen capture */}
        {hasScreen && !hasHLS && (
          <video ref={videoRef} autoPlay playsInline muted={isMuted} className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Upload */}
        {hasUpload && !hasHLS && (
          <video src={uploadedObjectUrl!} controls autoPlay playsInline muted={isMuted} className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Face detection */}
        <FaceDetectionOverlay videoElement={activeVideoEl} enabled={faceDetectionEnabled && !!hasAnyVideo} />

        {/* Stats overlay */}
        {isLive && <StreamStatsOverlay />}

        {/* State overlays */}
        <AnimatePresence mode="wait">
          {isLive ? (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
              {!hasScreen && !hasHLS && !hasUpload && (
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-primary/5 to-charcoal animate-pulse" />
              )}
              <div className="absolute inset-0 flex flex-col">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/80 text-white text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                  <div className="px-2 py-1 rounded bg-black/50 text-white text-xs font-mono">{formatTime(elapsedSeconds)}</div>
                </div>
                {!hasAnyVideo && (
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-24 h-24 rounded-full bg-primary/30 flex items-center justify-center">
                      <Radio className="h-12 w-12 text-primary" />
                    </motion.div>
                  </div>
                )}
                {isDetecting && (
                  <div className="p-3 mt-auto">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 text-white text-xs">
                      <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                      <span>AI Detection Active</span>
                      <span className="ml-auto text-muted-foreground">{detectedCount} moments</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : isConnecting ? (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-medium">Connecting to stream…</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            </motion.div>
          ) : isConnected && !hasAnyVideo ? (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-foreground font-medium">Ready to Stream</p>
                <p className="text-sm text-muted-foreground">Click "Start Monitoring" to begin</p>
              </div>
            </motion.div>
          ) : connectionStatus === "error" ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-foreground font-medium">Connection Failed</p>
                <p className="text-sm text-muted-foreground">Check credentials and retry</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setConnectionStatus("disconnected")}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            </motion.div>
          ) : !hasAnyVideo ? (
            <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium">No Stream Connected</p>
                <p className="text-sm text-muted-foreground">Select a mode and connect to preview</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
