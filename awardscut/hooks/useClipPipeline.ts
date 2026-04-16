"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/hooks/use-toast";

export interface AIMoment {
  timestamp: string;
  momentType: string;
  winnerName: string;
  awardName: string;
  confidenceScore: number;
  clipDuration: number;
}

export interface DBMoment {
  id: string;
  timestamp: string;
  moment_type: string;
  winner_name: string | null;
  award_name: string | null;
  confidence_score: number;
  video_filename: string | null;
  source_video_url: string | null;
  clip_start: number | null;
  clip_end: number | null;
}

export interface DBClip {
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

/** Parse a timestamp like "0:32" or "2:15" into total seconds */
function parseTimestamp(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return 0;
}

export function useClipPipeline() {
  const { user } = useUser();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedMoments, setDetectedMoments] = useState<DBMoment[]>([]);
  const [generatedClips, setGeneratedClips] = useState<DBClip[]>([]);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExistingData();
    // TODO: Set up realtime subscriptions when database is available
  }, [user]);

  const loadExistingData = async () => {
    if (!user) return;
    // TODO: Load from database when available
    // For now, keep empty
  };

  /** Generate real clips via edge function for a single moment */
  const generateClipForMoment = useCallback(async (
    moment: DBMoment,
    playbackId: string | undefined,
    videoUrl: string | undefined,
    clipDuration: number,
  ) => {
    // TODO: Implement clip generation when backend is available
    console.log("Generating clip for moment:", moment);
    return true;
  }, []);

  const startPipeline = useCallback(async (
    filename: string,
    videoUrl?: string,
    settings?: {
      detectionInterval?: number;
      clipDuration?: number;
      autoClipGeneration?: boolean;
      ceremonyName?: string;
      playbackId?: string;
      confidenceThreshold?: number;
    }
  ) => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to use AI detection.", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setPipelineComplete(false);
    setDetectedMoments([]);
    setGeneratedClips([]);

    toast({ title: "🧠 AI Detection Started", description: "Analyzing video for award ceremony moments..." });

    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress > 90) progress = 90;
      setScanProgress(Math.round(progress));
    }, 300);

    try {
      // TODO: Call detection API when available
      console.log("Starting pipeline with settings:", settings);

      // Simulate detection for demo
      setTimeout(() => {
        if (progressRef.current) clearInterval(progressRef.current);
        setScanProgress(100);
        setIsScanning(false);
        setPipelineComplete(true);

        // Add some mock moments
        const mockMoments: DBMoment[] = [
          {
            id: "1",
            timestamp: "1:23",
            moment_type: "Award Announcement",
            winner_name: "John Doe",
            award_name: "Best Innovation",
            confidence_score: 85,
            video_filename: filename,
            source_video_url: videoUrl || null,
            clip_start: 83,
            clip_end: 113,
          },
          {
            id: "2",
            timestamp: "3:45",
            moment_type: "Acceptance Speech",
            winner_name: "Jane Smith",
            award_name: "Lifetime Achievement",
            confidence_score: 92,
            video_filename: filename,
            source_video_url: videoUrl || null,
            clip_start: 225,
            clip_end: 255,
          },
        ];

        setDetectedMoments(mockMoments);

        // Mock clips
        const mockClips: DBClip[] = [
          {
            id: "1",
            moment_id: "1",
            winner_name: "John Doe",
            category: "Best Innovation",
            format: "horizontal",
            dimensions: "1920×1080",
            format_label: "16:9 (YouTube/LinkedIn)",
            status: "ready",
            duration_label: "30s",
            source_video_url: videoUrl || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            moment_id: "1",
            winner_name: "John Doe",
            category: "Best Innovation",
            format: "square",
            dimensions: "1080×1080",
            format_label: "1:1 (Feed)",
            status: "ready",
            duration_label: "30s",
            source_video_url: videoUrl || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        setGeneratedClips(mockClips);

        toast({
          title: "✅ Detection Complete",
          description: `${mockMoments.length} moments detected, ${mockClips.length} clips generated.`,
        });
      }, 3000);

    } catch (err: any) {
      if (progressRef.current) clearInterval(progressRef.current);
      setScanProgress(0);
      setIsScanning(false);
      toast({ title: "Pipeline error", description: err.message || "Something went wrong", variant: "destructive" });
    }
  }, [user]);

  const clearPipeline = useCallback(async () => {
    if (!user) return;

    // TODO: Clear from database when available
    setDetectedMoments([]);
    setGeneratedClips([]);
    setPipelineComplete(false);
    setScanProgress(0);
  }, [user]);

  const readyClipCount = generatedClips.filter(c => c.status === 'ready').length;

  return {
    isScanning,
    scanProgress,
    detectedMoments,
    generatedClips,
    pipelineComplete,
    readyClipCount,
    startPipeline,
    clearPipeline,
    loadExistingData,
    generateClipForMoment,
  };
}