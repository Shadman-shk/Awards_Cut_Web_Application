"use client";

import { useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const [streamData, setStreamData] = useState<LivepeerStreamData | null>(null);
  const [livepeerStatus, setLivepeerStatus] = useState<LivepeerConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createStream = useCallback(async () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to create a stream.", variant: "destructive" });
      return null;
    }

    setError(null);
    setLivepeerStatus("creating");

    try {
      // TODO: Call stream creation API when available
      console.log("Creating stream for user:", user.id);

      // Mock stream data for demo
      const mockData: LivepeerStreamData = {
        stream_id: `stream_${Date.now()}`,
        stream_key: `sk_${Math.random().toString(36).substring(2)}`,
        rtmps_url: "rtmps://rtmp.livepeer.com/live",
        rtmp_url: "rtmp://rtmp.livepeer.com/live",
        playback_id: `playback_${Date.now()}`,
        status: "idle",
      };

      setStreamData(mockData);
      setLivepeerStatus("ready");
      toast({ title: "✅ Stream Created", description: "RTMPS credentials ready. Configure your encoder." });
      return mockData;
    } catch (err: any) {
      const msg = err.message || "Unexpected error";
      setError(msg);
      setLivepeerStatus("error");
      toast({ title: "Error", description: msg, variant: "destructive" });
      return null;
    }
  }, [user]);

  const checkStatus = useCallback(async () => {
    if (!streamData?.stream_id) return null;

    try {
      // TODO: Call status check API when available
      console.log("Checking stream status:", streamData.stream_id);

      // Mock status check
      return { status: streamData.status };
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
      // TODO: Call delete API when available
      console.log("Deleting stream:", streamData.stream_id);
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
      // TODO: Call reset key API when available
      console.log("Resetting stream key:", streamData.stream_id);

      // Mock key reset
      const newKey = `sk_${Math.random().toString(36).substring(2)}`;
      setStreamData(prev => prev ? {
        ...prev,
        stream_key: newKey,
      } : prev);
      toast({ title: "Stream Key Reset", description: "New stream key generated." });
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