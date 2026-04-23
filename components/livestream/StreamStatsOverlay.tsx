"use client";

import { useEffect, useState } from "react";
import { useLivestreamStore } from "@/stores/livestreamStore";
import { Activity } from "lucide-react";

export function StreamStatsOverlay() {
  const { connectionStatus } = useLivestreamStore();
  const [stats, setStats] = useState({ bitrate: 0, fps: 0, resolution: "N/A" });

  useEffect(() => {
    if (connectionStatus !== "live") return;
    const interval = setInterval(() => {
      setStats({
        bitrate: 4000 + Math.floor(Math.random() * 1500),
        fps: 28 + Math.floor(Math.random() * 4),
        resolution: "1920×1080",
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  if (connectionStatus !== "live" || stats.bitrate === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-white/90">
        <Activity className="h-3 w-3 text-green-400" />
        <span>{stats.resolution}</span>
        <span className="text-white/40">|</span>
        <span>{stats.bitrate} kbps</span>
        <span className="text-white/40">|</span>
        <span>{stats.fps} fps</span>
      </div>
    </div>
  );
}
