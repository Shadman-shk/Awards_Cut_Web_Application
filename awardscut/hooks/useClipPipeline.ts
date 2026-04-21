"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedMoments, setDetectedMoments] = useState<DBMoment[]>([]);
  const [generatedClips, setGeneratedClips] = useState<DBClip[]>([]);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExistingData();

    const channel = supabase
      .channel('clips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_clips' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setGeneratedClips(prev => prev.map(c => c.id === (payload.new as DBClip).id ? payload.new as DBClip : c));
        } else if (payload.eventType === 'INSERT') {
          setGeneratedClips(prev => {
            if (prev.find(c => c.id === (payload.new as DBClip).id)) return prev;
            return [payload.new as DBClip, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detected_moments' }, (payload) => {
        setDetectedMoments(prev => {
          if (prev.find(m => m.id === (payload.new as DBMoment).id)) return prev;
          return [payload.new as DBMoment, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadExistingData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [momentsRes, clipsRes] = await Promise.all([
      supabase.from('detected_moments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('generated_clips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (momentsRes.data) setDetectedMoments(momentsRes.data as any);
    if (clipsRes.data) setGeneratedClips(clipsRes.data as any);
    if ((momentsRes.data?.length ?? 0) > 0) setPipelineComplete(true);
  };

  /** Generate real clips via edge function for a single moment */
  const generateClipForMoment = useCallback(async (
    moment: DBMoment,
    playbackId: string | undefined,
    videoUrl: string | undefined,
    clipDuration: number,
  ) => {
    // If we have a Livepeer playbackId, use the real clip API
    if (playbackId) {
      const timestampSeconds = parseTimestamp(moment.timestamp);
      const { data, error } = await supabase.functions.invoke('generate-clip', {
        body: {
          playbackId,
          momentTimestampSeconds: timestampSeconds,
          momentType: moment.moment_type,
          winnerName: moment.winner_name || 'Clip',
          momentId: moment.id,
          clipDuration,
        },
      });
      if (error || data?.error) {
        console.error('Clip generation failed:', data?.error || error?.message);
        return false;
      }
      // Clips are inserted by the edge function — realtime will pick them up
      return true;
    }

    // Fallback for uploaded videos: insert clip records pointing to the source video
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const formats = [
      { format: "horizontal", dimensions: "1920×1080", format_label: "16:9 (YouTube/LinkedIn)", duration_label: `${clipDuration}s` },
      { format: "square", dimensions: "1080×1080", format_label: "1:1 (Feed)", duration_label: `${clipDuration}s` },
      { format: "vertical", dimensions: "1080×1920", format_label: "9:16 (Stories/Reels)", duration_label: `${Math.max(15, Math.round(clipDuration * 0.5))}s` },
    ];

    const clipInserts = formats.map((fmt) => ({
      user_id: user.id,
      moment_id: moment.id,
      winner_name: moment.winner_name || 'Clip',
      category: moment.award_name || moment.moment_type,
      format: fmt.format,
      dimensions: fmt.dimensions,
      format_label: fmt.format_label,
      status: 'ready',
      duration_label: fmt.duration_label,
      source_video_url: videoUrl || moment.source_video_url || null,
    }));

    const { error: insertErr } = await supabase.from('generated_clips').insert(clipInserts).select();
    return !insertErr;
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
    const { data: { user } } = await supabase.auth.getUser();
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
      const { data, error } = await supabase.functions.invoke('detect-moments', {
        body: {
          filename,
          durationSeconds: 420,
          detectionInterval: settings?.detectionInterval || 10,
          clipDuration: settings?.clipDuration || 30,
          ceremonyName: settings?.ceremonyName || '',
        },
      });

      if (progressRef.current) clearInterval(progressRef.current);

      if (error || data?.error) {
        setScanProgress(0);
        setIsScanning(false);
        toast({ title: "Detection failed", description: data?.error || error?.message || "Unknown error", variant: "destructive" });
        return;
      }

      setScanProgress(95);
      const aiMoments: AIMoment[] = data.moments || [];

      if (aiMoments.length === 0) {
        setScanProgress(100);
        setIsScanning(false);
        toast({ title: "No moments detected", description: "AI could not find award moments. Try a different video.", variant: "destructive" });
        return;
      }

      const confidenceThreshold = settings?.confidenceThreshold || 0;

      // Insert moments with real video URL and computed clip boundaries
      const insertedMoments: DBMoment[] = [];
      for (const m of aiMoments) {
        // Skip moments below confidence threshold
        if (confidenceThreshold > 0 && m.confidenceScore < confidenceThreshold) continue;

        const clipStart = Math.max(0, parseTimestamp(m.timestamp) - 4);
        const clipEnd = clipStart + (m.clipDuration || 30);

        const { data: inserted, error: insertErr } = await supabase.from('detected_moments').insert({
          user_id: user.id,
          video_filename: filename,
          source_video_url: videoUrl || null,
          timestamp: m.timestamp,
          moment_type: m.momentType,
          winner_name: m.winnerName || null,
          award_name: m.awardName,
          confidence_score: m.confidenceScore,
          clip_start: clipStart,
          clip_end: clipEnd,
        } as any).select().single();

        if (inserted && !insertErr) {
          insertedMoments.push(inserted as any);
          setDetectedMoments(prev => [inserted as any, ...prev]);
        }

        await new Promise(r => setTimeout(r, 150));
      }

      setScanProgress(100);

      // Generate clips (only if autoClip enabled)
      const autoClip = settings?.autoClipGeneration !== false;
      if (!autoClip) {
        setIsScanning(false);
        setPipelineComplete(true);
        toast({ title: "✅ Detection Complete", description: `${insertedMoments.length} moments detected. Auto-clip disabled — generate clips manually.` });
        return;
      }

      const momentsWithWinners = insertedMoments.filter(m => m.winner_name);
      let clipCount = 0;

      for (const moment of momentsWithWinners) {
        const success = await generateClipForMoment(
          moment,
          settings?.playbackId,
          videoUrl,
          settings?.clipDuration || 30,
        );
        if (success) clipCount++;
        await new Promise(r => setTimeout(r, 300));
      }

      setIsScanning(false);
      setPipelineComplete(true);
      toast({
        title: "✅ Detection Complete",
        description: `${insertedMoments.length} moments detected, ${clipCount * 3} clips generated.`,
      });
    } catch (err: any) {
      if (progressRef.current) clearInterval(progressRef.current);
      setScanProgress(0);
      setIsScanning(false);
      toast({ title: "Pipeline error", description: err.message || "Something went wrong", variant: "destructive" });
    }
  }, [generateClipForMoment]);

  const clearPipeline = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all([
      supabase.from('generated_clips').delete().eq('user_id', user.id),
      supabase.from('detected_moments').delete().eq('user_id', user.id),
    ]);

    setDetectedMoments([]);
    setGeneratedClips([]);
    setPipelineComplete(false);
    setScanProgress(0);
  }, []);

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
