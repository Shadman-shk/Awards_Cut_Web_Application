"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, memo, useCallback } from "react";
import Hls from "hls.js";
import { Loader2, Zap } from "lucide-react";

interface HLSPlayerProps {
  playbackId?: string;
  src?: string;
  muted?: boolean;
  className?: string;
  onVideoElement?: (el: HTMLVideoElement | null) => void;
}

export const HLSPlayer = memo(
  forwardRef<HTMLVideoElement, HLSPlayerProps>(
    ({ playbackId, src, muted = false, className, onVideoElement }, ref) => {
      const videoRef = useRef<HTMLVideoElement>(null);
      const hlsRef = useRef<Hls | null>(null);
      const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const retryCountRef = useRef(0);
      const didInitialSyncRef = useRef(false);
      const [buffering, setBuffering] = useState(true);
      const [offline, setOffline] = useState(false);
      const [reconnecting, setReconnecting] = useState(false);
      const [driftBehind, setDriftBehind] = useState(false);

      useImperativeHandle(ref, () => videoRef.current!);

      useEffect(() => {
        onVideoElement?.(videoRef.current);
        return () => onVideoElement?.(null);
      }, [onVideoElement]);

      const clearRecoveryTimers = useCallback(() => {
        if (stallTimerRef.current) {
          clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }, []);

      const seekToLiveEdge = useCallback(() => {
        const video = videoRef.current;
        if (!video || !video.seekable.length) return;
        const liveEdge = video.seekable.end(video.seekable.length - 1);
        video.currentTime = Math.max(0, liveEdge - 0.5);
        setDriftBehind(false);
      }, []);

      const destroyHls = useCallback(() => {
        clearRecoveryTimers();
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        }
      }, [clearRecoveryTimers]);

      useEffect(() => {
        const video = videoRef.current;
        const streamSrc = src || (playbackId ? `https://livepeercdn.studio/hls/${playbackId}/index.m3u8` : "");
        if (!video || !streamSrc) return;

        retryCountRef.current = 0;
        didInitialSyncRef.current = false;
        setBuffering(true);
        setOffline(false);
        setReconnecting(false);
        setDriftBehind(false);

        const handlePlaying = () => {
          clearRecoveryTimers();
          setBuffering(false);
          setReconnecting(false);
          setOffline(false);
          retryCountRef.current = 0;
        };

        const handleCanPlay = () => {
          setBuffering(false);
          clearRecoveryTimers();
          if (!didInitialSyncRef.current) {
            seekToLiveEdge();
            didInitialSyncRef.current = true;
          }
        };

        const handleWaiting = () => {
          setBuffering(true);
          clearRecoveryTimers();

          stallTimerRef.current = setTimeout(() => {
            seekToLiveEdge();
          }, 2000);

          reconnectTimerRef.current = setTimeout(() => {
            if (video.readyState < 3) {
              setReconnecting(true);
              destroyHls();
              initHls();
            }
          }, 8000);
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

        const driftInterval = setInterval(() => {
          if (video.seekable.length && !video.paused) {
            const liveEdge = video.seekable.end(video.seekable.length - 1);
            const drift = liveEdge - video.currentTime;
            if (drift > 6) {
              setDriftBehind(true);
              seekToLiveEdge();
              setTimeout(() => setDriftBehind(false), 1000);
            } else if (drift > 3) {
              setDriftBehind(true);
            } else {
              setDriftBehind(false);
            }
          }
        }, 3000);

        function initHls() {
          clearRecoveryTimers();

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 0,
              maxBufferLength: 10,
              maxMaxBufferLength: 30,
              maxBufferSize: 60 * 1000 * 1000,
              maxBufferHole: 0.5,
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: 6,
              liveDurationInfinity: true,
              highBufferWatchdogPeriod: 2,
              nudgeOffset: 0.1,
              nudgeMaxRetry: 5,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 6,
              fragLoadingRetryDelay: 1000,
              manifestLoadingTimeOut: 15000,
              manifestLoadingMaxRetry: 4,
              manifestLoadingRetryDelay: 1000,
              levelLoadingTimeOut: 15000,
              levelLoadingMaxRetry: 4,
              levelLoadingRetryDelay: 1000,
              startFragPrefetch: true,
            });

            hls.loadSource(streamSrc);
            if (video) {
              hls.attachMedia(video);
            }

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (video) {
                video.play().catch(() => {});
              }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal) return;

              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                retryCountRef.current += 1;

                if (retryCountRef.current >= 8) {
                  setBuffering(false);
                  setReconnecting(false);
                  setOffline(true);
                  return;
                }

                setReconnecting(true);
                clearRecoveryTimers();
                reconnectTimerRef.current = setTimeout(() => {
                  hls.startLoad();
                }, 500 + retryCountRef.current * 500);
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            });

            hlsRef.current = hls;
          } else if (video && video.canPlayType("application/vnd.apple.mpegurl")) {
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
      }, [playbackId, src, seekToLiveEdge, destroyHls, clearRecoveryTimers]);

      return (
        <div className="relative w-full h-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={className}
            style={{ willChange: "auto" }}
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-xs text-foreground/70 font-medium">Buffering…</p>
              </div>
            </div>
          )}

          {reconnecting && (
            <div className="absolute top-2 left-2 badge-processing z-10">
              <Loader2 className="h-3 w-3 animate-spin" />
              Reconnecting…
            </div>
          )}

          {driftBehind && !reconnecting && (
            <div className="absolute top-2 left-2 badge-processing z-10">
              Syncing…
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
  (prev, next) => prev.playbackId === next.playbackId && prev.muted === next.muted
);

HLSPlayer.displayName = "HLSPlayer";
