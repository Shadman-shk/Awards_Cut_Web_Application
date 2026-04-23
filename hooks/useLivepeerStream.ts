"use client";
import { useState, useCallback, useRef } from "react";

interface StreamData {
  stream_id: string;
  stream_key: string;
  rtmp_url: string;
  rtmps_url: string;
  playback_id: string;
}

type LivepeerStatus = "idle" | "creating" | "ready" | "active" | "error";

export function useLivepeerStream() {
  const [livepeerStatus, setLivepeerStatus] = useState<LivepeerStatus>("idle");
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createStream = useCallback(async () => {
    setLivepeerStatus("creating");
    setError(null);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));
    const mockData: StreamData = {
      stream_id: `stream-${Date.now()}`,
      stream_key: `sk-live-${Math.random().toString(36).slice(2, 14)}`,
      rtmp_url: "rtmp://rtmp.livepeer.com/live",
      rtmps_url: "rtmps://rtmp.livepeer.com/live",
      playback_id: `pl-${Math.random().toString(36).slice(2, 10)}`,
    };
    setStreamData(mockData);
    setLivepeerStatus("ready");
  }, []);

  const deleteStream = useCallback(async () => {
    stopPolling();
    setStreamData(null);
    setLivepeerStatus("idle");
  }, []);

  const resetKey = useCallback(async () => {
    if (!streamData) return;
    const newKey = `sk-live-${Math.random().toString(36).slice(2, 14)}`;
    setStreamData({ ...streamData, stream_key: newKey });
  }, [streamData]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      // In real app, poll Livepeer API for stream status
      // For demo, randomly switch to active after some polls
      if (streamData && Math.random() > 0.7) {
        setLivepeerStatus("active");
      }
    }, 5000);
  }, [streamData]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    livepeerStatus,
    streamData,
    error,
    createStream,
    deleteStream,
    resetKey,
    startPolling,
    stopPolling,
  };
}
