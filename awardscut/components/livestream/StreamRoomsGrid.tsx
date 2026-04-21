"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Radio, Copy, Wifi, WifiOff, Loader2, Eye, EyeOff,
  Trash2, Plus, AlertTriangle, Edit2, Check, X,
  Activity, ChevronDown, ChevronUp, Brain, Zap, Scissors,
  Play, Download, Share2, Video, Square, Upload, MonitorPlay,
  Settings2, Clock, Timer,
} from "lucide-react";
import { downloadClipAsBlob, downloadAllClips } from "@/lib/clipDownload";
import { useDetectionSettings } from "@/hooks/useDetectionSettings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useStreamRooms, type StreamRoom } from "@/hooks/useStreamRooms";
import { useUserRole } from "@/hooks/useUserRole";
import { useClipPipeline } from "@/hooks/useClipPipeline";
import { HLSPlayer } from "./HLSPlayer";
import { UploadMode } from "./UploadMode";
import { ScreenCaptureMode } from "./ScreenCaptureMode";
import { Skeleton } from "@/components/ui/skeleton";
import type { DetectedMoment, GeneratedClip } from "./DetectionPanels";

type ClipPipeline = ReturnType<typeof useClipPipeline>;

export function StreamRoomsGrid({ pipeline }: { pipeline: ClipPipeline }) {
  const { rooms, loading, createRoom, deleteRoom, updateRoomName, checkRoomHealth, updateRoomStatus } = useStreamRooms();
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StreamRoom | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const hasAutoExpandedRef = useRef(false);
  const expandedPanelRef = useRef<HTMLDivElement | null>(null);

  // Poll health for all rooms every 10s
  useEffect(() => {
    if (rooms.length === 0) return;
    const interval = setInterval(() => {
      rooms.forEach(room => {
        if (room.livepeer_stream_id && room.status !== "gone") {
          checkRoomHealth(room);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [rooms, checkRoomHealth]);

  useEffect(() => {
    if (hasAutoExpandedRef.current || expandedRoomId || rooms.length === 0 || pipeline.generatedClips.length === 0) return;

    const preferredRoom = rooms.find((room) => room.status === "live" || room.status === "monitoring") ?? rooms[0];
    if (!preferredRoom) return;

    hasAutoExpandedRef.current = true;
    setExpandedRoomId(preferredRoom.id);
  }, [expandedRoomId, rooms, pipeline.generatedClips.length]);

  useEffect(() => {
    if (!expandedRoomId) return;

    const frame = window.requestAnimationFrame(() => {
      expandedPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [expandedRoomId]);

  const openRoomWithClips = () => {
    const preferredRoom = rooms.find((room) => room.status === "live" || room.status === "monitoring") ?? rooms[0];
    if (preferredRoom) setExpandedRoomId(preferredRoom.id);
  };

  const handleCreate = async () => {
    if (!newRoomName.trim()) {
      toast({ title: "Enter a room name", variant: "destructive" });
      return;
    }
    if (rooms.length >= 4) {
      toast({ title: "Maximum 4 rooms", description: "Delete a room before adding more.", variant: "destructive" });
      return;
    }
    setCreating(true);
    const room = await createRoom(newRoomName.trim());
    setNewRoomName("");
    setCreating(false);
    if (room) setExpandedRoomId(room.id);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      if (expandedRoomId === deleteTarget.id) setExpandedRoomId(null);
      await deleteRoom(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  const activePreviewRoomId = expandedRoomId ?? rooms.find((room) => (
    room.livepeer_playback_id && (room.status === "live" || room.status === "monitoring")
  ))?.id ?? null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Stream Rooms</h2>
            <p className="text-sm text-muted-foreground">Manage multiple simultaneous streams with AI detection</p>
          </div>
          {rooms.length < 4 && (
            <div className="flex items-center gap-2">
              {pipeline.readyClipCount > 0 && (
                <Button variant="secondary" size="sm" onClick={openRoomWithClips}>
                  <Scissors className="h-4 w-4" />
                  View Clips
                </Button>
              )}
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name…"
                className="w-40 h-9 text-sm bg-muted border-border/50"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button variant="hero" size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Room
              </Button>
            </div>
          )}
        </div>

        {rooms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 rounded-2xl bg-card border border-border/50 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Stream Rooms</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first room to start streaming with AI detection</p>
            <div className="flex items-center justify-center gap-2">
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Main Stage"
                className="w-48 bg-muted border-border/50"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button variant="hero" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Room
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Grid of room cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence>
                {rooms.map((room) => (
                  <StreamRoomCard
                    key={room.id}
                    room={room}
                    isExpanded={expandedRoomId === room.id}
                    previewEnabled={!expandedRoomId && activePreviewRoomId === room.id}
                    onToggleExpand={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                    onDelete={() => setDeleteTarget(room)}
                    onRename={(name) => updateRoomName(room.id, name)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Expanded room detail panel */}
            <AnimatePresence>
              {expandedRoomId && (
                <div ref={expandedPanelRef}>
                  <ExpandedRoomPanel
                    key={expandedRoomId}
                    room={rooms.find(r => r.id === expandedRoomId)!}
                    pipeline={pipeline}
                    onClose={() => setExpandedRoomId(null)}
                    onStatusChange={(status) => updateRoomStatus(expandedRoomId, status)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate the Livepeer stream and remove all room data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Room Card (compact) ─── */
function StreamRoomCard({
  room,
  isExpanded,
  previewEnabled,
  onToggleExpand,
  onDelete,
  onRename,
}: {
  room: StreamRoom;
  isExpanded: boolean;
  previewEnabled: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);

  const statusConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    live: { cls: "badge-live", icon: <span className="live-dot" />, label: "Live" },
    idle: { cls: "badge-idle", icon: <Activity className="h-3 w-3" />, label: "Idle" },
    gone: { cls: "badge-gone", icon: <WifiOff className="h-3 w-3" />, label: "Gone" },
    monitoring: { cls: "badge-processing", icon: <Brain className="h-3 w-3" />, label: "Monitoring" },
  };
  const status = statusConfig[room.status] || statusConfig.idle;
  const canPlayPreview = previewEnabled && room.livepeer_playback_id && (room.status === "live" || room.status === "monitoring");

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== room.name) onRename(editName.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl bg-card border overflow-hidden cursor-pointer transition-all ${
        isExpanded ? "border-primary shadow-lg shadow-primary/10" : "border-border/50 hover:border-border"
      }`}
      onClick={() => !editing && onToggleExpand()}
    >
      {/* Preview thumbnail */}
      <div className="aspect-video bg-charcoal relative">
        {canPlayPreview ? (
          <HLSPlayer playbackId={room.livepeer_playback_id!} muted className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Radio className="h-8 w-8 text-muted-foreground opacity-30 mx-auto mb-2" />
              {room.livepeer_playback_id && (room.status === "live" || room.status === "monitoring") && (
                <p className="text-[11px] text-muted-foreground">Open room for live preview</p>
              )}
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={status.cls}>
            {status.icon} {status.label}
          </span>
        </div>
        {(room.status === "live" || room.status === "monitoring") && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/80 text-destructive-foreground text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        {/* Expand indicator */}
        <div className="absolute bottom-2 right-2">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-white/60" /> : <ChevronDown className="h-4 w-4 text-white/60" />}
        </div>
      </div>

      {/* Info bar */}
      <div className="p-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <div className="flex items-center gap-1 flex-1 mr-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm bg-muted border-border/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveName}><Check className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm">{room.name}</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditName(room.name); setEditing(true); }}>
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="h-8 px-3 gap-1.5 text-xs font-medium"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Room
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Expanded Room Panel (preview + credentials + AI detection + clips) ─── */
function ExpandedRoomPanel({
  room,
  pipeline,
  onClose,
  onStatusChange,
}: {
  room: StreamRoom;
  pipeline: ClipPipeline;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  const { canRevealStreamKey } = useUserRole();
  const { settings } = useDetectionSettings();
  const [showKey, setShowKey] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(room.status === "monitoring");
  const [inputMode, setInputMode] = useState<"rtmp" | "upload" | "screen">("rtmp");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [showDetectionSettings, setShowDetectionSettings] = useState(false);
  const [previewClip, setPreviewClip] = useState<{ url: string; title: string } | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const roomVideoUrl = uploadedVideoUrl
    || (room.livepeer_playback_id ? `https://livepeercdn.studio/hls/${room.livepeer_playback_id}/index.m3u8` : undefined);

  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const [downloadedClipId, setDownloadedClipId] = useState<string | null>(null);

  const handleDownloadClip = async (videoUrl: string, filename: string, clipId?: string) => {
    if (clipId) setDownloadingClipId(clipId);
    const success = await downloadClipAsBlob(videoUrl, filename, clipId);
    if (clipId) {
      setDownloadingClipId(null);
      if (success) {
        setDownloadedClipId(clipId);
        setTimeout(() => setDownloadedClipId(null), 2000);
      }
    }
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    onStatusChange("monitoring");
    pipeline.startPipeline(`room-${room.id}-stream.mp4`, roomVideoUrl, {
      detectionInterval: settings.detection_interval_seconds,
      clipDuration: settings.clip_duration_seconds,
      autoClipGeneration: settings.auto_clip_enabled,
      playbackId: room.livepeer_playback_id || undefined,
      confidenceThreshold: settings.confidence_threshold,
    });
    toast({ title: "🔴 AI Monitoring Started", description: `Detecting moments in "${room.name}" every ${settings.detection_interval_seconds}s` });
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    onStatusChange(room.livepeer_stream_id ? "idle" : "idle");
    toast({ title: "Monitoring Stopped", description: "AI detection paused." });
  };

  // Convert pipeline data for display
  const displayMoments: DetectedMoment[] = pipeline.detectedMoments.map((m) => ({
    id: m.id,
    timestamp: m.timestamp,
    type: m.winner_name ? `${m.moment_type} — ${m.award_name || ""}` : m.moment_type,
    confidence: m.confidence_score,
    clipGenerated: pipeline.generatedClips.some((c) => c.moment_id === m.id),
    winnerName: m.winner_name || undefined,
    category: m.award_name || m.moment_type,
    sourceVideoUrl: m.source_video_url || undefined,
    clipStart: m.clip_start ?? 0,
    clipEnd: m.clip_end ?? 30,
  }));

  const displayClips = pipeline.generatedClips.map((c) => ({
    id: c.id,
    momentId: c.moment_id || "",
    timestamp: "",
    duration: parseInt(c.duration_label || "30"),
    winner: c.winner_name,
    category: c.category,
    status: (c.status === "ready" ? "ready" : c.status === "processing" || c.status === "queued" ? "generating" : "failed") as "ready" | "generating" | "failed",
    format: c.format_label,
    sourceVideoUrl: c.source_video_url || undefined,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl bg-card border border-primary/30 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{room.name}</h3>
            <p className="text-xs text-muted-foreground">Stream control & AI detection</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Input Mode Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/30 w-fit">
          {([
            { key: "rtmp" as const, label: "RTMP Livestream", icon: <Radio className="h-3.5 w-3.5" />, badge: "Recommended" },
            { key: "upload" as const, label: "Video Upload", icon: <Upload className="h-3.5 w-3.5" />, badge: "Backup" },
            { key: "screen" as const, label: "Screen Capture", icon: <MonitorPlay className="h-3.5 w-3.5" />, badge: "Fallback" },
          ]).map((mode) => (
            <button
              key={mode.key}
              onClick={() => setInputMode(mode.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                inputMode === mode.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        {/* Two-column: Preview + Input Controls */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Stream Preview */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" /> Stream Preview
            </h4>
            <div className="aspect-video rounded-xl bg-charcoal border border-border/50 relative overflow-hidden">
              {/* HLS preview for RTMP mode */}
              {inputMode === "rtmp" && room.livepeer_playback_id && (room.status === "live" || room.status === "monitoring") ? (
                <HLSPlayer playbackId={room.livepeer_playback_id} muted className="w-full h-full object-contain" />
              ) : uploadedVideoUrl && inputMode === "upload" ? (
                <video src={uploadedVideoUrl} controls autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {inputMode === "rtmp" ? (
                      <>
                        <Radio className="h-10 w-10 text-muted-foreground opacity-30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Waiting for encoder…</p>
                        <p className="text-xs text-muted-foreground">Connect OBS using the credentials</p>
                      </>
                    ) : inputMode === "upload" ? (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground opacity-30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No video uploaded</p>
                        <p className="text-xs text-muted-foreground">Upload a video to preview</p>
                      </>
                    ) : (
                      <>
                        <MonitorPlay className="h-10 w-10 text-muted-foreground opacity-30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Screen capture inactive</p>
                        <p className="text-xs text-muted-foreground">Start capture to preview</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {(room.status === "live" || room.status === "monitoring") && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/80 text-destructive-foreground text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              )}
              {isMonitoring && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-xs text-white">
                  <Brain className="h-3 w-3 text-primary animate-pulse" />
                  AI Active
                </div>
              )}
            </div>

            {/* Detection Settings + Monitoring controls */}
            {!isMonitoring && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30 space-y-3">
                <button
                  onClick={() => setShowDetectionSettings(!showDetectionSettings)}
                  className="flex items-center justify-between w-full text-xs"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Settings2 className="h-3.5 w-3.5" /> AI Detection Settings
                  </span>
                  <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${showDetectionSettings ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showDetectionSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2.5"
                    >
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/20 text-[10px] text-muted-foreground">
                        <p className="font-medium text-foreground text-xs mb-1">Using Detection Settings Panel</p>
                        <p>Scan: every {settings.detection_interval_seconds}s · Clip: {settings.clip_duration_seconds}s · Confidence: ≥{settings.confidence_threshold}%</p>
                        <p>Auto-clip: {settings.auto_clip_enabled ? "Enabled" : "Disabled"} · Mode: {settings.sensitivity_mode}</p>
                        <p className="mt-1 text-primary">Configure in the Detection Settings panel below ↓</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex gap-2">
              {!isMonitoring ? (
                <Button variant="hero" size="sm" className="flex-1" onClick={handleStartMonitoring}>
                  <Brain className="h-4 w-4" /> Start AI Monitoring
                </Button>
              ) : (
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleStopMonitoring}>
                  <Square className="h-4 w-4" /> Stop Monitoring
                </Button>
              )}
            </div>

            {/* Scan progress */}
            {pipeline.isScanning && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <Brain className="h-3 w-3 text-primary" />
                    AI analyzing…
                  </span>
                  <span className="text-foreground font-mono">{pipeline.scanProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" style={{ width: `${pipeline.scanProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Mode Controls */}
          <div className="space-y-3">
            {inputMode === "rtmp" && (
              <>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" /> RTMP Credentials
                </h4>

                {room.status === "gone" ? (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Stream no longer exists. Delete this room and create a new one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">OBS / Encoder Settings</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Protocol</span><p className="text-foreground mt-0.5 font-medium">RTMP</p></div>
                        <div><span className="text-muted-foreground">Recommended</span><p className="text-foreground mt-0.5">x264 · 4500 kbps</p></div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Server URL</label>
                      <div className="flex gap-1.5">
                        <Input value={room.rtmp_url || ""} readOnly className="bg-muted border-border/50 font-mono text-xs h-8" />
                        <Button variant="secondary" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(room.rtmp_url || "", "RTMP URL")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Stream Key</label>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Input
                            value={room.livepeer_stream_key || ""}
                            readOnly
                            type={showKey ? "text" : "password"}
                            className="bg-muted border-border/50 font-mono text-xs h-8 pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!canRevealStreamKey) {
                                toast({ title: "Permission denied", description: "Only Owner/Admin can reveal keys.", variant: "destructive" });
                                return;
                              }
                              setShowKey(!showKey);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                          if (!canRevealStreamKey) {
                            toast({ title: "Permission denied", variant: "destructive" });
                            return;
                          }
                          copyToClipboard(room.livepeer_stream_key || "", "Stream Key");
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {inputMode === "upload" && (
              <UploadMode
                onVideoReady={(filename, videoUrl) => {
                  setUploadedVideoUrl(videoUrl);
                  onStatusChange("monitoring");
                  setIsMonitoring(true);
                  pipeline.startPipeline(filename, videoUrl, {
                    detectionInterval: settings.detection_interval_seconds,
                    clipDuration: settings.clip_duration_seconds,
                    autoClipGeneration: settings.auto_clip_enabled,
                    confidenceThreshold: settings.confidence_threshold,
                  });
                }}
              />
            )}

            {inputMode === "screen" && (
              <ScreenCaptureMode />
            )}
          </div>
        </div>

        {/* AI Detection + Generated Clips */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Detected Moments */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">AI Detection</h4>
              </div>
              {displayMoments.length > 0 && (
                <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {displayMoments.length} moments
                </span>
              )}
            </div>

            {/* Log */}
            {displayMoments.length > 0 && (
              <div className="mb-3 p-2 rounded-lg bg-charcoal/50 border border-border/20 max-h-16 overflow-y-auto font-mono text-[10px] text-muted-foreground space-y-0.5">
                {displayMoments.slice(0, 5).map((m) => (
                  <p key={m.id}>
                    <span className="text-green-500">[{m.timestamp}]</span>{" "}
                    {m.winnerName ? `${m.category} — ${m.winnerName}` : m.type}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {displayMoments.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <Zap className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">No moments detected yet</p>
                  <p className="text-[10px]">Start AI monitoring to detect moments</p>
                </div>
              ) : (
                displayMoments.map((moment) => (
                  <div key={moment.id} className="p-2 rounded-lg bg-card border border-border/20 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">
                        {moment.winnerName ? `${moment.category} — ${moment.winnerName}` : moment.type}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{moment.timestamp}</span>
                        <span>•</span>
                        <span className="text-green-500">{moment.confidence}%</span>
                      </div>
                    </div>
                    {moment.clipGenerated && (
                      <span className="text-[10px] text-green-500 font-medium flex items-center gap-0.5 shrink-0">
                        <Scissors className="h-2.5 w-2.5" /> Clipped
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generated Clips */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Generated Clips</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {displayClips.filter(c => c.status === "ready").length} ready
                </span>
                {displayClips.filter(c => c.status === "ready").length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={async () => {
                      const readyClips = displayClips.filter((c) => c.status === "ready" && c.sourceVideoUrl);
                      const items = readyClips.map((clip) => ({
                        url: clip.sourceVideoUrl || "",
                        filename: `${clip.category}-${clip.winner}-${clip.format?.replace(/[^a-zA-Z0-9]/g, '')}.mp4`,
                        id: clip.id,
                      }));
                      await downloadAllClips(items, toast);
                    }}
                  >
                    <Download className="h-3 w-3 mr-0.5" /> All
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {displayClips.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <Video className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">No clips generated yet</p>
                  <p className="text-[10px]">Clips appear after AI detects moments</p>
                </div>
              ) : (
                displayClips.map((clip) => (
                  <div key={clip.id} className="p-2 rounded-lg bg-card border border-border/20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!clip.sourceVideoUrl) {
                          toast({ title: "Clip not ready", description: "This RTMP clip URL is still being prepared.", variant: "destructive" });
                          return;
                        }
                        setPreviewClip({
                          url: clip.sourceVideoUrl,
                          title: `${clip.category} — ${clip.winner}`,
                        });
                      }}
                      className="w-10 h-7 rounded-md bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0"
                    >
                      {clip.status === "ready" ? (
                        <Play className="h-3 w-3 text-primary" />
                      ) : clip.status === "generating" ? (
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      ) : (
                        <X className="h-3 w-3 text-destructive" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">
                        {clip.category} — {clip.winner}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{clip.format}</span>
                        <span>•</span>
                        <span>~{clip.duration}s</span>
                      </div>
                    </div>
                    {clip.status === "ready" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            if (!clip.sourceVideoUrl) {
                              toast({ title: "Clip not ready", description: "No generated clip file is available yet.", variant: "destructive" });
                              return;
                            }
                            setPreviewClip({
                              url: clip.sourceVideoUrl,
                              title: `${clip.category} — ${clip.winner}`,
                            });
                          }}
                          className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
                          title="Preview clip"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (!clip.sourceVideoUrl) {
                              toast({ title: "Clip not ready", description: "No generated clip file is available yet.", variant: "destructive" });
                              return;
                            }
                            handleDownloadClip(clip.sourceVideoUrl, `${clip.category}-${clip.winner}-${clip.format?.replace(/[^a-zA-Z0-9]/g, '')}.mp4`, clip.id);
                          }}
                          disabled={downloadingClipId === clip.id}
                          className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                          title="Download clip"
                        >
                          {downloadingClipId === clip.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : downloadedClipId === clip.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            if (!clip.sourceVideoUrl) {
                              toast({ title: "Clip not ready", description: "No clip link available yet.", variant: "destructive" });
                              return;
                            }
                            navigator.clipboard.writeText(clip.sourceVideoUrl);
                            toast({ title: "Link copied!" });
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {clip.status === "generating" && (
                      <span className="text-[10px] text-yellow-500 font-medium shrink-0">Processing</span>
                    )}
                    {clip.status === "failed" && (
                      <span className="text-[10px] text-destructive font-medium shrink-0">Failed</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!previewClip} onOpenChange={(open) => !open && setPreviewClip(null)}>
        <DialogContent className="max-w-4xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>{previewClip?.title || "Clip Preview"}</DialogTitle>
          </DialogHeader>
          {previewClip?.url ? (
            previewClip.url.includes(".m3u8") || previewClip.url.includes("/hls/") ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                <HLSPlayer src={previewClip.url} className="w-full h-full object-contain" />
              </div>
            ) : (
              <video
                src={previewClip.url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[70vh] rounded-lg bg-black"
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
