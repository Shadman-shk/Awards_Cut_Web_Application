"use client";

import { motion } from "framer-motion";
import { Radio, Upload, MonitorPlay } from "lucide-react";

export type VideoInputMode = "rtmp" | "upload" | "screen";

interface ModeSelectorProps {
  activeMode: VideoInputMode;
  onModeChange: (mode: VideoInputMode) => void;
  disabled?: boolean;
}

const modes = [
  { id: "rtmp" as const, label: "RTMP Livestream", description: "Professional OBS/Encoder", icon: Radio, tag: "Recommended", tagAccent: true },
  { id: "upload" as const, label: "Video Upload", description: "Upload pre-recorded video", icon: Upload, tag: "Backup", tagAccent: false },
  { id: "screen" as const, label: "Screen Capture", description: "Capture from browser", icon: MonitorPlay, tag: "Fallback", tagAccent: false },
];

export function ModeSelector({ activeMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => !disabled && onModeChange(mode.id)}
            disabled={disabled}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              isActive
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]"
                : "bg-card border-border/50 hover:border-border"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                <mode.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{mode.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
              </div>
            </div>
            <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              mode.tagAccent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {mode.tag}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
