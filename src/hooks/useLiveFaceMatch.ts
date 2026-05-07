/**
 * Live face matcher — fully decoupled from video playback.
 *
 * Architecture:
 * - Scans on an interval (default 2.5s) using `requestIdleCallback` when
 *   available, so detection yields to higher-priority work (rendering,
 *   decoding, user input). Falls back to plain `setTimeout`.
 * - Detection runs on a downscaled (320px) copy of the frame — never
 *   touches the full-resolution playback path.
 * - Errors are swallowed: a detection failure NEVER affects the stream.
 * - Match results are debounced 5s per awardee to avoid badge flicker.
 */
import { useEffect, useRef, useState } from "react";
import {
  computeDescriptorsFromVideo,
  findBestMatch,
  loadFaceModels,
  type EnrolledFace,
} from "@/lib/faceRecognition";

export interface LiveFaceMatch {
  faceId: string;
  awardeeName: string;
  awardCategoryId: string | null;
  distance: number;
  detectedAt: number;
}

type IdleCallbackHandle = number;
interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}
const requestIdle = (cb: (d: IdleDeadline) => void, timeout = 1000): IdleCallbackHandle => {
  const w = window as unknown as {
    requestIdleCallback?: (cb: (d: IdleDeadline) => void, opts?: { timeout: number }) => number;
  };
  if (w.requestIdleCallback) return w.requestIdleCallback(cb, { timeout });
  return window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1) as unknown as number;
};

export function useLiveFaceMatch(
  videoRef: React.MutableRefObject<HTMLVideoElement | null>,
  enrolled: EnrolledFace[],
  options: { enabled: boolean; intervalMs?: number; threshold?: number } = { enabled: false }
) {
  const [currentMatch, setCurrentMatch] = useState<LiveFaceMatch | null>(null);
  const [scanning, setScanning] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [lastScanMs, setLastScanMs] = useState<number | null>(null);
  const busyRef = useRef(false);
  const recentMatchesRef = useRef<Record<string, number>>({});
  const enrolledRef = useRef(enrolled);
  enrolledRef.current = enrolled;

  // Pre-load models when enabled (one-time, ~7MB)
  useEffect(() => {
    if (!options.enabled) return;
    let cancelled = false;
    loadFaceModels()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch(() => {
        // Model load failure must not break playback — just disable matching
        if (!cancelled) setModelsReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [options.enabled]);

  useEffect(() => {
    if (!options.enabled || enrolled.length === 0 || !modelsReady) {
      setScanning(false);
      return;
    }

    setScanning(true);
    const interval = options.intervalMs ?? 2500;
    const threshold = options.threshold ?? 0.55;
    let stopped = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const runDetection = async () => {
      if (stopped || busyRef.current) return;
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) return;
      busyRef.current = true;
      const t0 = performance.now();
      try {
        const descriptors = await computeDescriptorsFromVideo(video);
        let bestOverall: LiveFaceMatch | null = null;
        for (const d of descriptors) {
          const m = findBestMatch(d, enrolledRef.current, threshold);
          if (m && (!bestOverall || m.distance < bestOverall.distance)) {
            bestOverall = {
              faceId: m.face.id,
              awardeeName: m.face.awardee_name,
              awardCategoryId: m.face.award_category_id,
              distance: m.distance,
              detectedAt: Date.now(),
            };
          }
        }
        if (bestOverall) {
          const last = recentMatchesRef.current[bestOverall.faceId] || 0;
          if (Date.now() - last > 5000) {
            recentMatchesRef.current[bestOverall.faceId] = Date.now();
            setCurrentMatch(bestOverall);
          }
        }
      } catch {
        // Detection failure is fully isolated from playback
      } finally {
        busyRef.current = false;
        setLastScanMs(Math.round(performance.now() - t0));
      }
    };

    const schedule = () => {
      if (stopped) return;
      timeoutId = setTimeout(() => {
        // Yield to idle time so detection never competes with paint/decode
        requestIdle(() => {
          void runDetection().finally(schedule);
        }, interval);
      }, interval);
    };

    // Kick off first scan after a short delay so playback stabilises first
    timeoutId = setTimeout(() => {
      requestIdle(() => {
        void runDetection().finally(schedule);
      }, 1500);
    }, 1500);

    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      setScanning(false);
    };
  }, [options.enabled, options.intervalMs, options.threshold, enrolled.length, modelsReady, videoRef]);

  const clearMatch = () => setCurrentMatch(null);

  return { currentMatch, scanning, modelsReady, lastScanMs, clearMatch };
}
