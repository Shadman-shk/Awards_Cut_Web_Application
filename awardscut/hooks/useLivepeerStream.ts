"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LivepeerStreamData {
  stream_id: string;
  stream_key: string;
  rtmps_url: string;
  rtmp_url: string;
  playback_id: string | null;
  status: string;
}

export type LivepeerConnectionStatus = "disconnected" | "creating" | "ready" | "active" | "error";

export function useLivepeerStream() {
  const [streamData, setStreamData] = useState<LivepeerStreamData | null>(null);
  const [livepeerStatus, setLivepeerStatus] = useState<LivepeerConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createStream = useCallback(async () => {
    setError(null);
    setLivepeerStatus("creating");

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'create' },
      });

      if (fnErr || data?.error) {
        const msg = data?.error || fnErr?.message || "Failed to create stream";
        setError(msg);
        setLivepeerStatus("error");
        toast({ title: "Stream creation failed", description: msg, variant: "destructive" });
        return null;
      }

      setStreamData(data);
      setLivepeerStatus("ready");
      toast({ title: "✅ Stream Created", description: "RTMPS credentials ready. Configure your encoder." });
      return data as LivepeerStreamData;
    } catch (err: any) {
      const msg = err.message || "Unexpected error";
      setError(msg);
      setLivepeerStatus("error");
      toast({ title: "Error", description: msg, variant: "destructive" });
      return null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!streamData?.stream_id) return null;

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'status', stream_id: streamData.stream_id },
      });

      if (fnErr || data?.error) return null;

      if (data.status === 'gone') {
        // Stream no longer exists on Livepeer — clean up local state
        setStreamData(null);
        setLivepeerStatus("disconnected");
        return null;
      }

      if (data.status === 'active') {
        setLivepeerStatus("active");
      } else if (data.status === 'idle') {
        setLivepeerStatus("ready");
      }

      return data;
    } catch {
      return null;
    }
  }, [streamData]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      await checkStatus();
    }, 5000);
  }, [checkStatus]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const deleteStream = useCallback(async () => {
    stopPolling();
    if (!streamData?.stream_id) return;

    try {
      await supabase.functions.invoke('mux-stream', {
        body: { action: 'delete', stream_id: streamData.stream_id },
      });
    } catch {
      // Best effort
    }

    setStreamData(null);
    setLivepeerStatus("disconnected");
    setError(null);
    toast({ title: "Stream Deleted", description: "Livepeer live stream removed." });
  }, [streamData, stopPolling]);

  const resetKey = useCallback(async () => {
    if (!streamData?.stream_id) return;

    try {
      const { data } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'reset_key', stream_id: streamData.stream_id },
      });

      if (data?.stream_key) {
        setStreamData(prev => prev ? {
          ...prev,
          stream_id: data.stream_id || prev.stream_id,
          stream_key: data.stream_key,
          playback_id: data.playback_id || prev.playback_id,
        } : prev);
        toast({ title: "Stream Key Reset", description: "New stream key generated." });
      }
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  }, [streamData]);

  return {
    streamData,
    livepeerStatus,
    error,
    createStream,
    checkStatus,
    startPolling,
    stopPolling,
    deleteStream,
    resetKey,
  };
}
