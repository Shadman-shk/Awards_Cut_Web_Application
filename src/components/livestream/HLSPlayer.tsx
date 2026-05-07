import { useEffect, useRef, useState, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import Hls from "hls.js";
import { Loader2, Zap } from "lucide-react";

interface HLSPlayerProps {
  playbackId?: string;
  src?: string;
  muted?: boolean;
  className?: string;
  onVideoElement?: (el: HTMLVideoElement | null) => void;
  eager?: boolean;
  posterMode?: boolean;
  showPerfOverlay?: boolean;
}

/**
 * Adaptive low-latency HLS player optimized for live RTMP previews.
 *
 * Strategy (no quality loss):
 * - Adaptive buffer: 2–5s window, ABR free to pick top rendition
 * - Drift correction via playbackRate (0.95–1.05x) — no hard seeks unless severe
 * - Seamless reconnect via hls.startLoad() (never reload <video>)
 * - Hardware-accelerated decode: rely on browser default + `transform: translateZ(0)`
 * - Detection pipeline runs OUTSIDE this component on the same <video> element
 */
export const HLSPlayer = memo(
  forwardRef<HTMLVideoElement, HLSPlayerProps>(
    ({ playbackId, src, muted = false, className, onVideoElement, eager = true, posterMode = false, showPerfOverlay = false }, ref) => {
      const videoRef = useRef<HTMLVideoElement>(null);
      const hlsRef = useRef<Hls | null>(null);
      const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const retryCountRef = useRef(0);
      const didInitialSyncRef = useRef(false);
      const [buffering, setBuffering] = useState(true);
      const [offline, setOffline] = useState(false);
      const [reconnecting, setReconnecting] = useState(false);
      const [driftBehind, setDriftBehind] = useState(false);
      const [latencyMs, setLatencyMs] = useState<number | null>(null);
      const [bitrateKbps, setBitrateKbps] = useState<number | null>(null);
      const [resolution, setResolution] = useState<string | null>(null);

      useImperativeHandle(ref, () => videoRef.current!);

      useEffect(() => {
        onVideoElement?.(videoRef.current);
        return () => onVideoElement?.(null);
      }, [onVideoElement]);

      const clearRecoveryTimers = useCallback(() => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }, []);

      const seekToLiveEdge = useCallback(() => {
        const video = videoRef.current;
        if (!video || !video.seekable.length) return;
        const liveEdge = video.seekable.end(video.seekable.length - 1);
        // Land slightly inside the edge so we don't immediately stall
        video.currentTime = Math.max(0, liveEdge - 1.0);
        video.playbackRate = 1.0;
        setDriftBehind(false);
      }, []);

      const destroyHls = useCallback(() => {
        clearRecoveryTimers();
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      }, [clearRecoveryTimers]);

      useEffect(() => {
        const video = videoRef.current;
        const streamSrc = src || (playbackId ? `https://livepeercdn.studio/hls/${playbackId}/index.m3u8` : "");
        if (!video || !streamSrc || !eager) return;

        retryCountRef.current = 0;
        didInitialSyncRef.current = false;
        setBuffering(true);
        setOffline(false);
        setReconnecting(false);
        setDriftBehind(false);

        const handlePlaying = () => {
          setBuffering(false);
          setReconnecting(false);
          setOffline(false);
          retryCountRef.current = 0;
        };

        const handleCanPlay = () => {
          setBuffering(false);
          if (!didInitialSyncRef.current) {
            seekToLiveEdge();
            didInitialSyncRef.current = true;
          }
        };

        const handleWaiting = () => {
          // Soft signal — don't show "buffering" overlay for short hiccups.
          // Adaptive buffer + reconnect handler below will recover.
          setBuffering(true);
        };

        const handleLoadedMetadata = () => {
          if (!didInitialSyncRef.current) {
            seekToLiveEdge();
            didInitialSyncRef.current = true;
          }
          video.play().catch(() => {});
        };

        video.addEventListener("playing", handlePlaying);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);

        // Drift correction loop — uses playbackRate instead of hard seeks.
        // Keeps quality intact and avoids visible jumps.
        const driftInterval = setInterval(() => {
          if (!video.seekable.length || video.paused) return;
          const liveEdge = video.seekable.end(video.seekable.length - 1);
          const drift = liveEdge - video.currentTime;
          setLatencyMs(Math.max(0, Math.round(drift * 1000)));

          if (drift > 8) {
            // Hard out-of-sync: jump to live edge
            seekToLiveEdge();
            setDriftBehind(true);
            setTimeout(() => setDriftBehind(false), 800);
          } else if (drift > 3) {
            // Speed up gently to catch up — imperceptible to viewers
            video.playbackRate = 1.05;
            setDriftBehind(true);
          } else if (drift > 1.5) {
            video.playbackRate = 1.02;
            setDriftBehind(false);
          } else if (drift < 0.6 && video.playbackRate !== 1.0) {
            // Too close to edge — slow down a hair to avoid stalling
            video.playbackRate = 0.98;
          } else {
            video.playbackRate = 1.0;
          }
        }, 1000);

        function initHls() {
          clearRecoveryTimers();

          if (Hls.isSupported()) {
            const hls = new Hls({
              autoStartLoad: !posterMode,
              enableWorker: true, // segment parsing off main thread
              lowLatencyMode: !posterMode,
              backBufferLength: 4,
              // Adaptive 2–5s window: enough to absorb network jitter
              // without hurting latency. ABR is free to pick the top rendition.
              maxBufferLength: posterMode ? 2 : 5,
              maxMaxBufferLength: posterMode ? 4 : 10,
              maxBufferSize: posterMode ? 6 * 1000 * 1000 : 60 * 1000 * 1000,
              maxBufferHole: 0.5,
              liveSyncDurationCount: 2,
              liveMaxLatencyDurationCount: 4,
              liveDurationInfinity: true,
              highBufferWatchdogPeriod: 2,
              nudgeOffset: 0.2,
              nudgeMaxRetry: 5,
              liveBackBufferLength: 0,
              // Aggressive but graceful retries for live fragments
              fragLoadingTimeOut: 10000,
              fragLoadingMaxRetry: 6,
              fragLoadingRetryDelay: 500,
              manifestLoadingTimeOut: 10000,
              manifestLoadingMaxRetry: 6,
              manifestLoadingRetryDelay: 500,
              levelLoadingTimeOut: 10000,
              levelLoadingMaxRetry: 6,
              levelLoadingRetryDelay: 500,
              startFragPrefetch: !posterMode,
              // -1 = ABR picks best rendition for current bandwidth (keep quality)
              startLevel: -1,
              testBandwidth: true,
              // Parallel segment fetching (hls.js uses keep-alive HTTP/2 where available)
              progressive: true,
            });

            hls.loadSource(streamSrc);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (posterMode) return;
              video.play().catch(() => {});
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
              const level = hls.levels[data.level];
              if (level) {
                setBitrateKbps(Math.round(level.bitrate / 1000));
                setResolution(level.height ? `${level.height}p` : null);
              }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal) return;

              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                retryCountRef.current += 1;

                if (retryCountRef.current >= 12) {
                  setBuffering(false);
                  setReconnecting(false);
                  setOffline(true);
                  return;
                }

                // Seamless reconnect — never tear down the <video>
                setReconnecting(true);
                clearRecoveryTimers();
                reconnectTimerRef.current = setTimeout(() => {
                  try {
                    hls.startLoad();
                  } catch {
                    // Last-resort: rebuild HLS but keep the video element alive
                    destroyHls();
                    initHls();
                  }
                }, 400 + retryCountRef.current * 400);
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            });

            hlsRef.current = hls;
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamSrc;
            video.play().catch(() => {});
          }
        }

        initHls();

        return () => {
          video.removeEventListener("playing", handlePlaying);
          video.removeEventListener("waiting", handleWaiting);
          video.removeEventListener("canplay", handleCanPlay);
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          clearInterval(driftInterval);
          clearRecoveryTimers();
          destroyHls();
        };
      }, [playbackId, src, eager, posterMode, seekToLiveEdge, destroyHls, clearRecoveryTimers]);

      return (
        <div className="relative w-full h-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            // CRITICAL: required so canvas.drawImage(video) + toDataURL() can
            // read pixels for the AI detection pipeline (without this, the
            // canvas becomes "tainted" and frame capture silently returns null).
            crossOrigin="anonymous"
            preload={posterMode ? "metadata" : "auto"}
            className={className}
            // Hint compositor to use GPU layer for the video — smoother decode/scale
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          />

          {offline && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">Stream Offline</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Waiting for broadcast…</p>
              </div>
            </div>
          )}

          {buffering && !reconnecting && !offline && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {reconnecting && (
            <div className="absolute top-2 left-2 badge-processing z-10">
              <Loader2 className="h-3 w-3 animate-spin" />
              Reconnecting…
            </div>
          )}

          {/* Live latency badge */}
          {latencyMs !== null && !buffering && !offline && !reconnecting && (
            <div
              className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-md text-[10px] font-mono font-semibold backdrop-blur-sm ${
                latencyMs < 3000
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : latencyMs < 6000
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
              title="Glass-to-glass latency"
            >
              ● {(latencyMs / 1000).toFixed(1)}s
            </div>
          )}

          {/* Performance debug overlay */}
          {showPerfOverlay && !offline && (
            <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white/80 space-y-0.5">
              {resolution && <div>res: {resolution}</div>}
              {bitrateKbps !== null && <div>br: {bitrateKbps} kbps</div>}
              {latencyMs !== null && <div>lat: {(latencyMs / 1000).toFixed(2)}s</div>}
              <div>rate: {videoRef.current?.playbackRate.toFixed(2) ?? "1.00"}x</div>
            </div>
          )}

          {driftBehind && !reconnecting && (
            <button
              onClick={seekToLiveEdge}
              className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-semibold hover:bg-primary transition-colors"
            >
              <Zap className="h-3 w-3" /> Sync Live
            </button>
          )}
        </div>
      );
    }
  ),
  (prev, next) =>
    prev.playbackId === next.playbackId &&
    prev.src === next.src &&
    prev.muted === next.muted &&
    prev.className === next.className &&
    prev.eager === next.eager &&
    prev.posterMode === next.posterMode &&
    prev.showPerfOverlay === next.showPerfOverlay
);

HLSPlayer.displayName = "HLSPlayer";
