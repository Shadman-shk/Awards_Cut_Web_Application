import { useEffect, useRef, useState, useCallback } from "react";
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

type LatencyMode = "webrtc" | "hls" | "connecting";

/**
 * WebRTC operator preview using Livepeer's WHEP endpoint.
 * Falls back to HLS if WebRTC negotiation fails.
 *
 * WHEP spec: POST SDP offer to https://playback.livepeer.studio/webrtc/{playbackId}
 * Server responds with SDP answer + Location header for ICE candidates.
 */
function LivepeerWebRTCPlayer({
  playbackId,
  muted,
  onVideoElement,
  onModeChange,
}: {
  playbackId: string;
  muted: boolean;
  onVideoElement?: (el: HTMLVideoElement | null) => void;
  onModeChange: (mode: LatencyMode) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [fallbackToHls, setFallbackToHls] = useState(false);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (fallbackToHls) return;
    if (!playbackId) return;

    let cancelled = false;
    onModeChange("connecting");

    const connect = async () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // We only want to receive
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && event.streams[0]) {
            video.srcObject = event.streams[0];
            video.play().catch(() => {});
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (!pcRef.current) return;
          const state = pcRef.current.iceConnectionState;
          if (state === "connected" || state === "completed") {
            onModeChange("webrtc");
          } else if (state === "failed" || state === "disconnected") {
            console.warn("WebRTC ICE failed, falling back to HLS");
            setFallbackToHls(true);
            onModeChange("hls");
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait briefly for ICE gathering (or use trickle via Location header)
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") return resolve();
          const onChange = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", onChange);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", onChange);
          // Timeout safety
          setTimeout(resolve, 1500);
        });

        if (cancelled) return;

        const whepUrl = `https://playback.livepeer.studio/webrtc/${playbackId}`;
        const resp = await fetch(whepUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: pc.localDescription?.sdp ?? "",
        });

        if (!resp.ok) {
          throw new Error(`WHEP failed: ${resp.status}`);
        }

        const answerSdp = await resp.text();
        if (cancelled) return;
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (err) {
        console.warn("WebRTC setup failed, falling back to HLS:", err);
        if (!cancelled) {
          setFallbackToHls(true);
          onModeChange("hls");
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [playbackId, fallbackToHls, cleanup, onModeChange]);

  if (fallbackToHls) {
    return (
      <HLSPlayer
        playbackId={playbackId}
        muted={muted}
        className="absolute inset-0 w-full h-full object-contain"
        onVideoElement={onVideoElement}
      />
    );
  }

  return (
    <video
      ref={(el) => {
        videoRef.current = el;
        onVideoElement?.(el);
      }}
      autoPlay
      playsInline
      muted={muted}
      className="absolute inset-0 w-full h-full object-contain"
    />
  );
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
  const [latencyMode, setLatencyMode] = useState<LatencyMode>("connecting");

  const isLive = connectionStatus === "live";
  const isConnecting = connectionStatus === "connecting";
  const isConnected = connectionStatus === "connected";

  // Attach screen stream
  useEffect(() => {
    if (videoRef.current && screenStream && mode === "screen") {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, mode]);

  const hasWebRTC = mode === "rtmp" && streamData?.playbackId && (isLive || isConnected);
  const hasScreen = mode === "screen" && screenStream && isLive;
  const hasUpload = mode === "upload" && uploadedObjectUrl && (isConnected || isLive);
  const hasAnyVideo = hasWebRTC || hasScreen || hasUpload;

  const activeVideoEl = hasWebRTC ? hlsVideoEl : hasScreen ? videoRef.current : null;
  const detectedCount = detectedMoments.length;

  const latencyBadge = (() => {
    if (!hasWebRTC) return null;
    if (latencyMode === "webrtc") return { cls: "bg-green-500/90 text-white", label: "Live • <1s" };
    if (latencyMode === "hls") return { cls: "bg-yellow-500/90 text-black", label: "Live • ~10s (HLS fallback)" };
    return { cls: "bg-muted text-foreground", label: "Connecting…" };
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Stream Preview</h2>
            <p className="text-sm text-muted-foreground">Operator preview · sub-second WebRTC playback</p>
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
        {/* WebRTC operator preview (sub-second latency, falls back to HLS) */}
        {hasWebRTC && (
          <LivepeerWebRTCPlayer
            playbackId={streamData!.playbackId}
            muted={isMuted}
            onVideoElement={setHlsVideoEl}
            onModeChange={setLatencyMode}
          />
        )}

        {/* Screen capture */}
        {hasScreen && !hasWebRTC && (
          <video ref={videoRef} autoPlay playsInline muted={isMuted} className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Upload */}
        {hasUpload && !hasWebRTC && (
          <video src={uploadedObjectUrl!} controls autoPlay playsInline muted={isMuted} className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Face detection */}
        <FaceDetectionOverlay videoElement={activeVideoEl} enabled={faceDetectionEnabled && !!hasAnyVideo} />

        {/* Stats overlay */}
        {isLive && <StreamStatsOverlay />}

        {/* Latency badge */}
        {latencyBadge && (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow ${latencyBadge.cls}`}>
            {latencyBadge.label}
          </div>
        )}

        {/* State overlays */}
        <AnimatePresence mode="wait">
          {isLive ? (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
              {!hasScreen && !hasWebRTC && !hasUpload && (
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
