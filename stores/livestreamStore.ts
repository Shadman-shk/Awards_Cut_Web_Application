"use client";
import { create } from "zustand";
import type { DetectedMomentItem } from "@/components/livestream/AIMomentDetection";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "live" | "error";
type VideoInputMode = "rtmp" | "upload" | "screen";

interface StreamData {
  id: string;
  streamKey: string;
  rtmpUrl: string;
  playbackId: string;
  playbackUrl: string;
  isActive: boolean;
}

interface LivestreamState {
  mode: VideoInputMode;
  setMode: (mode: VideoInputMode) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  streamData: StreamData | null;
  setStreamData: (data: StreamData | null) => void;
  elapsedSeconds: number;
  isMuted: boolean;
  toggleMute: () => void;
  isDetecting: boolean;
  setIsDetecting: (v: boolean) => void;
  detectedMoments: DetectedMomentItem[];
  addDetectedMoment: (m: DetectedMomentItem) => void;
  uploadedFile: File | null;
  uploadedObjectUrl: string | null;
  setUploadedFile: (file: File | null, url?: string | null) => void;
  screenStream: MediaStream | null;
  setScreenStream: (s: MediaStream | null) => void;
  detectionInterval: number;
  setDetectionInterval: (n: number) => void;
  clipDuration: number;
  setClipDuration: (n: number) => void;
  autoClip: boolean;
  setAutoClip: (v: boolean) => void;
  startStreamTimer: () => void;
  resetTimer: () => void;
  _timerInterval: ReturnType<typeof setInterval> | null;
}

export const useLivestreamStore = create<LivestreamState>((set, get) => ({
  mode: "rtmp",
  setMode: (mode) => set({ mode }),
  connectionStatus: "disconnected",
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  streamData: null,
  setStreamData: (streamData) => set({ streamData }),
  elapsedSeconds: 0,
  isMuted: true,
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  isDetecting: false,
  setIsDetecting: (isDetecting) => set({ isDetecting }),
  detectedMoments: [],
  addDetectedMoment: (m) => set((s) => ({ detectedMoments: [...s.detectedMoments, m] })),
  uploadedFile: null,
  uploadedObjectUrl: null,
  setUploadedFile: (file, url) => set({ uploadedFile: file, uploadedObjectUrl: url || (file ? URL.createObjectURL(file) : null) }),
  screenStream: null,
  setScreenStream: (screenStream) => set({ screenStream }),
  detectionInterval: 5,
  setDetectionInterval: (detectionInterval) => set({ detectionInterval }),
  clipDuration: 30,
  setClipDuration: (clipDuration) => set({ clipDuration }),
  autoClip: true,
  setAutoClip: (autoClip) => set({ autoClip }),
  _timerInterval: null,
  startStreamTimer: () => {
    const existing = get()._timerInterval;
    if (existing) clearInterval(existing);
    set({ elapsedSeconds: 0 });
    const interval = setInterval(() => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })), 1000);
    set({ _timerInterval: interval, isDetecting: true });
  },
  resetTimer: () => {
    const existing = get()._timerInterval;
    if (existing) clearInterval(existing);
    set({ _timerInterval: null, elapsedSeconds: 0, isDetecting: false });
  },
}));
