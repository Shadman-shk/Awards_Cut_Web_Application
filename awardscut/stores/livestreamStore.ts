"use client";

import { create } from "zustand";

export type VideoInputMode = "rtmp" | "upload" | "screen";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "live" | "error";

export interface StreamData {
  id: string;
  streamKey: string;
  rtmpUrl: string;
  playbackId: string;
  playbackUrl: string;
  isActive: boolean;
}

export interface MomentEntry {
  id: string;
  timestamp: string;
  type: string;
  confidence: number;
  clipGenerated: boolean;
  winnerName?: string;
  category?: string;
  sourceVideoUrl?: string;
  clipStart?: number;
  clipEnd?: number;
}

export interface ClipEntry {
  id: string;
  momentId: string;
  timestamp: string;
  duration: number;
  winner?: string;
  category?: string;
  status: "generating" | "ready" | "failed";
  format?: string;
  sourceVideoUrl?: string;
}

interface LivestreamState {
  // Mode
  mode: VideoInputMode | null;
  setMode: (mode: VideoInputMode | null) => void;

  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (s: ConnectionStatus) => void;

  // Stream data (Livepeer)
  streamData: StreamData | null;
  setStreamData: (d: StreamData | null) => void;

  // Upload
  uploadedFile: File | null;
  uploadedObjectUrl: string | null;
  setUploadedFile: (file: File | null, objectUrl: string | null) => void;

  // Screen capture
  screenStream: MediaStream | null;
  setScreenStream: (s: MediaStream | null) => void;

  // Timing
  streamStartTime: number | null;
  elapsedSeconds: number;
  startStreamTimer: () => void;
  incrementElapsed: () => void;
  resetTimer: () => void;

  // Detection results
  detectedMoments: MomentEntry[];
  generatedClips: ClipEntry[];
  setDetectedMoments: (m: MomentEntry[]) => void;
  addMoment: (m: MomentEntry) => void;
  setGeneratedClips: (c: ClipEntry[]) => void;
  addClip: (c: ClipEntry) => void;
  updateClipStatus: (id: string, status: ClipEntry["status"]) => void;

  // Detection settings
  detectionInterval: 5 | 10 | 30;
  clipDuration: 15 | 30 | 45 | 60;
  autoClip: boolean;
  isDetecting: boolean;
  setDetectionInterval: (v: 5 | 10 | 30) => void;
  setClipDuration: (v: 15 | 30 | 45 | 60) => void;
  setAutoClip: (v: boolean) => void;
  setIsDetecting: (v: boolean) => void;

  // Mute
  isMuted: boolean;
  toggleMute: () => void;

  // Reset
  resetAll: () => void;
}

const initialState = {
  mode: "rtmp" as VideoInputMode | null,
  connectionStatus: "disconnected" as ConnectionStatus,
  streamData: null as StreamData | null,
  uploadedFile: null as File | null,
  uploadedObjectUrl: null as string | null,
  screenStream: null as MediaStream | null,
  streamStartTime: null as number | null,
  elapsedSeconds: 0,
  detectedMoments: [] as MomentEntry[],
  generatedClips: [] as ClipEntry[],
  detectionInterval: 10 as 5 | 10 | 30,
  clipDuration: 30 as 15 | 30 | 45 | 60,
  autoClip: true,
  isDetecting: false,
  isMuted: false,
};

export const useLivestreamStore = create<LivestreamState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode, connectionStatus: "disconnected", streamData: null, uploadedFile: null, uploadedObjectUrl: null, screenStream: null, elapsedSeconds: 0, streamStartTime: null }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setStreamData: (d) => set({ streamData: d }),

  setUploadedFile: (file, objectUrl) => set({ uploadedFile: file, uploadedObjectUrl: objectUrl }),

  setScreenStream: (s) => set({ screenStream: s }),

  startStreamTimer: () => set({ streamStartTime: Date.now(), elapsedSeconds: 0 }),
  incrementElapsed: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  resetTimer: () => set({ streamStartTime: null, elapsedSeconds: 0 }),

  setDetectedMoments: (m) => set({ detectedMoments: m }),
  addMoment: (m) => set((s) => ({ detectedMoments: [m, ...s.detectedMoments] })),
  setGeneratedClips: (c) => set({ generatedClips: c }),
  addClip: (c) => set((s) => ({ generatedClips: [c, ...s.generatedClips] })),
  updateClipStatus: (id, status) => set((s) => ({ generatedClips: s.generatedClips.map((c) => (c.id === id ? { ...c, status } : c)) })),

  setDetectionInterval: (v) => set({ detectionInterval: v }),
  setClipDuration: (v) => set({ clipDuration: v }),
  setAutoClip: (v) => set({ autoClip: v }),
  setIsDetecting: (v) => set({ isDetecting: v }),

  isMuted: false,
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  resetAll: () => set(initialState),
}));