"use client";
import { useState, useCallback, useRef } from "react";

interface DetectedMoment {
  id: string;
  timestamp: string;
  moment_type: string;
  confidence_score: number;
  winner_name?: string;
  award_name?: string;
  source_video_url?: string;
  clip_start?: number;
  clip_end?: number;
}

interface GeneratedClip {
  id: string;
  moment_id?: string;
  winner_name?: string;
  category?: string;
  status: "queued" | "processing" | "ready" | "failed";
  format_label?: string;
  duration_label?: string;
  source_video_url?: string;
}

interface PipelineOptions {
  detectionInterval?: number;
  clipDuration?: number;
  autoClipGeneration?: boolean;
  playbackId?: string;
  confidenceThreshold?: number;
}

const MOCK_MOMENTS = [
  { type: "Award Announcement", winner: "Sarah Chen", award: "Innovation Award", icon: "🏆", confidence: 95 },
  { type: "Standing Ovation", winner: "Team Alpha", award: "Best Team", icon: "👏", confidence: 92 },
  { type: "Emotional Reaction", winner: "James Park", award: "Lifetime Achievement", icon: "😢", confidence: 88 },
  { type: "Group Celebration", winner: "Marketing Dept", award: "Revenue Champion", icon: "🎉", confidence: 91 },
  { type: "Speech Highlight", winner: "Dr. Lisa Wong", award: "Research Excellence", icon: "🎤", confidence: 85 },
  { type: "Trophy Moment", winner: "Alex Rivera", award: "Rising Star", icon: "🏅", confidence: 93 },
];

export function useClipPipeline() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [detectedMoments, setDetectedMoments] = useState<DetectedMoment[]>([]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [readyClipCount, setReadyClipCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPipeline = useCallback((filename: string, videoUrl?: string, options?: PipelineOptions) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setDetectedMoments([]);
    setGeneratedClips([]);

    let progress = 0;
    let momentIndex = 0;

    intervalRef.current = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        setScanProgress(100);
        setIsScanning(false);
        setScanComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setScanProgress(Math.round(progress));

      if (Math.random() > 0.5 && momentIndex < MOCK_MOMENTS.length) {
        const template = MOCK_MOMENTS[momentIndex];
        momentIndex++;
        const mins = Math.floor(Math.random() * 60);
        const secs = Math.floor(Math.random() * 60);
        const momentId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const newMoment: DetectedMoment = {
          id: momentId,
          timestamp: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
          moment_type: template.type,
          confidence_score: template.confidence + Math.floor(Math.random() * 6 - 3),
          winner_name: template.winner,
          award_name: template.award,
          source_video_url: videoUrl || undefined,
          clip_start: mins * 60 + secs,
          clip_end: mins * 60 + secs + (options?.clipDuration || 30),
        };
        setDetectedMoments((prev) => [...prev, newMoment]);

        if (options?.autoClipGeneration !== false) {
          const clipId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const newClip: GeneratedClip = {
            id: clipId,
            moment_id: momentId,
            winner_name: template.winner,
            category: template.award,
            status: "processing",
            format_label: "Winner Moment (16:9)",
            duration_label: String(options?.clipDuration || 30),
            source_video_url: videoUrl || undefined,
          };
          setGeneratedClips((prev) => [...prev, newClip]);

          setTimeout(() => {
            setGeneratedClips((prev) =>
              prev.map((c) => (c.id === clipId ? { ...c, status: "ready" as const } : c))
            );
            setReadyClipCount((prev) => prev + 1);
          }, 2000 + Math.random() * 3000);
        }
      }
    }, 800);
  }, []);

  const stopPipeline = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scanProgress,
    scanComplete,
    detectedMoments,
    generatedClips,
    readyClipCount,
    startPipeline,
    stopPipeline,
    moments: detectedMoments.map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      type: m.moment_type,
      confidence: m.confidence_score,
      icon: "🏆",
    })),
  };
}
