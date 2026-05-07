import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

export interface AIMoment {
  timestamp: string;
  momentType: string;
  winnerName: string;
  awardName: string;
  confidenceScore: number;
  clipDuration: number;
}

export interface DetectionFrame {
  dataUrl: string;
  sourceKind: "rtmp" | "upload" | "screen";
}

export interface DBMoment {
  id: string;
  stream_room_id?: string | null;
  matched_award_category_id?: string | null;
  timestamp: string;
  moment_type: string;
  winner_name: string | null;
  award_name: string | null;
  confidence_score: number;
  video_filename: string | null;
  source_video_url: string | null;
  clip_start: number | null;
  clip_end: number | null;
  created_at: string;
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
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monitorBusyRef = useRef(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const activeRunStartedAtRef = useRef<number | null>(null);
  const hydrationVersionRef = useRef(0);

  const isRecordFromActiveRun = useCallback((createdAt?: string | null) => {
    if (!activeRunStartedAtRef.current || !createdAt) return true;

    const recordTimestamp = new Date(createdAt).getTime();
    if (Number.isNaN(recordTimestamp)) return false;

    return recordTimestamp >= activeRunStartedAtRef.current - 1500;
  }, []);

  useEffect(() => {
    void loadExistingData();

    const channel = supabase
      .channel('clips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_clips' }, (payload) => {
        const nextClip = payload.new as DBClip;

        if (payload.eventType === 'UPDATE') {
          setGeneratedClips(prev => prev.map(c => c.id === nextClip.id ? nextClip : c));
          return;
        }

        if (!isRecordFromActiveRun(nextClip.created_at)) {
          return;
        }

        if (payload.eventType === 'INSERT') {
          setGeneratedClips(prev => {
            if (prev.find(c => c.id === nextClip.id)) return prev;
            return [nextClip, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detected_moments' }, (payload) => {
        const nextMoment = payload.new as DBMoment;
        if (!isRecordFromActiveRun(nextMoment.created_at)) {
          return;
        }

        setDetectedMoments(prev => {
          if (prev.find(m => m.id === nextMoment.id)) return prev;
          return [nextMoment, ...prev];
        });

        // Smooth handoff without forcing navigation. Auto-redirect was causing
        // the preview to look like a white screen while clips were still processing.
        const winner = nextMoment.winner_name || "Award moment";
        const award = nextMoment.award_name || nextMoment.moment_type;
        sonnerToast.success(`AI detected: ${winner}`, {
          description: `${award} • clip is queued in the background`,
          duration: 6000,
          action: {
            label: "Open now",
            onClick: () => {
              if (typeof window !== "undefined" && window.location.pathname !== "/dashboard/clip-generation") {
                window.location.href = "/dashboard/clip-generation?focus=latest";
              }
            },
          },
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isRecordFromActiveRun]);

  const loadExistingData = useCallback(async () => {
    const hydrationVersion = ++hydrationVersionRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [momentsRes, clipsRes] = await Promise.all([
      supabase.from('detected_moments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('generated_clips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(75),
    ]);

    if (hydrationVersion !== hydrationVersionRef.current || activeRunStartedAtRef.current) return;

    if (momentsRes.data) setDetectedMoments(momentsRes.data as any);
    if (clipsRes.data) setGeneratedClips(clipsRes.data as any);
    if ((momentsRes.data?.length ?? 0) > 0) setPipelineComplete(true);
  }, []);

  /** Generate real clips via edge function for a single moment */
  const generateClipForMoment = useCallback(async (
    moment: DBMoment,
    playbackId: string | undefined,
    videoUrl: string | undefined,
    clipDuration: number,
    streamTiming?: { streamRoomId?: string; streamStartedAt?: string | null },
  ) => {
    const saveFailedClip = async (reason: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('generated_clips').insert({
        user_id: user.id,
        moment_id: moment.id,
        winner_name: moment.winner_name || moment.award_name || 'Award Moment',
        category: moment.award_name || moment.moment_type || 'Award',
        format: 'horizontal',
        dimensions: '1920×1080',
        format_label: '16:9 (YouTube/LinkedIn)',
        status: 'failed',
        duration_label: `${clipDuration}s`,
        source_video_url: null,
        award_category_id: moment.matched_award_category_id ?? null,
        start_offset_seconds: moment.clip_start ?? null,
        end_offset_seconds: moment.clip_end ?? null,
        error_message: reason,
      } as any);
    };

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
          award_category_id: moment.matched_award_category_id ?? null,
          stream_room_id: streamTiming?.streamRoomId,
          stream_started_at: streamTiming?.streamStartedAt,
        },
      });
      if (error || data?.error) {
        const reason = data?.error || error?.message || 'Clip generation failed';
        console.error('Clip generation failed:', reason);
        await saveFailedClip(reason);
        return false;
      }
      const assetId = data?.assetId;
      if (assetId) {
        [8_000, 18_000, 35_000, 60_000].forEach((delay) => {
          window.setTimeout(() => {
            void supabase.functions.invoke('resolve-clip-download', { body: { assetId } });
          }, delay);
        });
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
      streamRoomId?: string;
      streamStartedAt?: string | null;
      confidenceThreshold?: number;
      captureFrame?: () => DetectionFrame | null;
      preserveRun?: boolean;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Authentication required", description: "Please log in to use AI detection.", variant: "destructive" });
      return;
    }

    if (!settings?.preserveRun || !activeRunStartedAtRef.current) {
      activeRunStartedAtRef.current = Date.now();
      hydrationVersionRef.current += 1;
    }
    if (progressRef.current) clearInterval(progressRef.current);
    setIsScanning(true);
    setScanProgress(0);
    if (!settings?.preserveRun) {
      setPipelineComplete(false);
      setDetectedMoments([]);
      setGeneratedClips([]);
    }

    let frame = settings?.captureFrame?.() ?? null;
    if (!frame && settings?.captureFrame) {
      // HLS can be visibly mounted while the video element still reports
      // readyState=0 for a moment. Wait briefly instead of losing the first
      // AI tick and making the operator think clip generation is broken.
      for (let attempt = 0; attempt < 8 && !frame; attempt++) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        frame = settings.captureFrame();
      }
    }

    if (!frame) {
      console.warn("[pipeline] No frame captured this tick — skipping AI detection. Check video element + crossOrigin.");
      // Surface a one-shot warning so user knows monitoring is live but waiting on video.
      if (!(window as any).__awardscut_frame_warned) {
        (window as any).__awardscut_frame_warned = true;
        sonnerToast.warning("Waiting for live video", {
          description: "AI detection will start as soon as the stream preview is visible.",
          duration: 5000,
        });
        // Reset the flag after 30s so we re-warn if the issue persists
        window.setTimeout(() => { (window as any).__awardscut_frame_warned = false; }, 30000);
      }
      setScanProgress(0);
      setIsScanning(false);
      return;
    }

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
          frameDataUrl: frame.dataUrl,
          sourceKind: frame.sourceKind,
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
        if (!settings?.preserveRun) setPipelineComplete(true);
        return;
      }

      const confidenceThreshold = settings?.confidenceThreshold || 0;

      const { data: categories } = await supabase
        .from('award_categories')
        .select('id, name, recipient_name')
        .eq('user_id', user.id)
        .is('triggered_at', null)
        .order('scheduled_order', { ascending: true });

      const matchAward = (m: AIMoment) => {
        const haystack = `${m.awardName || ''} ${m.winnerName || ''}`.toLowerCase();
        const cats = (categories || []) as Array<{ id: string; name: string; recipient_name: string | null }>;
        const direct = cats.find((c) =>
          haystack.includes((c.name || '').toLowerCase()) ||
          (c.recipient_name && haystack.includes(c.recipient_name.toLowerCase()))
        );
        return direct ?? (cats.length === 1 ? cats[0] : null);
      };

      // Insert moments with real video URL and computed clip boundaries
      const insertedMoments: DBMoment[] = [];
      for (const m of aiMoments) {
        // Skip moments below confidence threshold
        if (confidenceThreshold > 0 && m.confidenceScore < confidenceThreshold) continue;

        const detectedAtSeconds = settings?.streamStartedAt
          ? Math.max(0, Math.floor((Date.now() - new Date(settings.streamStartedAt).getTime()) / 1000))
          : parseTimestamp(m.timestamp);
        const timestampLabel = `${Math.floor(detectedAtSeconds / 60)}:${String(detectedAtSeconds % 60).padStart(2, "0")}`;
        const clipStart = Math.max(0, detectedAtSeconds - 4);
        const clipEnd = clipStart + (m.clipDuration || 30);
        const matchedAward = matchAward(m);

        const { data: inserted, error: insertErr } = await supabase.from('detected_moments').insert({
          user_id: user.id,
          stream_room_id: settings?.streamRoomId || null,
          video_filename: filename,
          source_video_url: videoUrl || null,
          timestamp: timestampLabel,
          timestamp_seconds: detectedAtSeconds,
          moment_type: m.momentType,
          winner_name: m.winnerName || matchedAward?.recipient_name || matchedAward?.name || 'Award Moment',
          award_name: matchedAward?.name || m.awardName,
          matched_award_category_id: matchedAward?.id || null,
          matched_phrase: `${m.momentType}${m.winnerName ? `: ${m.winnerName}` : ''}`,
          status: 'pending_review',
          confidence: m.confidenceScore / 100,
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
        return;
      }

      let clipCount = 0;

      for (const moment of insertedMoments) {
        const success = await generateClipForMoment(
          moment,
          settings?.playbackId,
          videoUrl,
          settings?.clipDuration || 30,
          { streamRoomId: settings?.streamRoomId, streamStartedAt: settings?.streamStartedAt },
        );
        if (success) clipCount++;
        await new Promise(r => setTimeout(r, 300));
      }

      setIsScanning(false);
      setPipelineComplete(true);
      if (clipCount > 0) {
        toast({
          title: "🎬 New clips generated",
          description: `${clipCount} winner ${clipCount === 1 ? "clip" : "clips"} queued. Open Clip Generation when you want to preview/download.`,
        });
      }
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
    activeRunStartedAtRef.current = null;
  }, []);

  const startMonitoring = useCallback((
    filename: string,
    videoUrl: string | undefined,
    settings: Parameters<typeof startPipeline>[2],
  ) => {
    if (monitorRef.current) clearInterval(monitorRef.current);
    setIsMonitoring(true);
    const intervalSec = Math.max(15, settings?.detectionInterval || 15);

    const tick = async () => {
      if (monitorBusyRef.current) return;
      monitorBusyRef.current = true;
      try {
        await startPipeline(filename, videoUrl, { ...settings, preserveRun: true });
      } finally {
        monitorBusyRef.current = false;
      }
    };

    // Run immediately, then on interval
    void tick();
    monitorRef.current = setInterval(tick, intervalSec * 1000);
  }, [startPipeline]);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) clearInterval(monitorRef.current);
    monitorRef.current = null;
    monitorBusyRef.current = false;
    setIsMonitoring(false);
    setIsScanning(false);
    setScanProgress(0);
  }, []);

  useEffect(() => () => {
    if (monitorRef.current) clearInterval(monitorRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const readyClipCount = generatedClips.filter(c => c.status === 'ready').length;

  return {
    isScanning,
    isMonitoring,
    scanProgress,
    detectedMoments,
    generatedClips,
    pipelineComplete,
    readyClipCount,
    startPipeline,
    startMonitoring,
    stopMonitoring,
    clearPipeline,
    loadExistingData,
    generateClipForMoment,
  };
}
