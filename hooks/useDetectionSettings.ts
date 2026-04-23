"use client";
import { useState, useCallback } from "react";

export const ALL_MOMENT_TYPES = [
  "Award Announcement", "Acceptance Speech", "Crowd Reaction", "Trophy Moment",
  "Standing Ovation", "Emotional Reaction", "Group Photo", "Musical Performance",
];

export const DEFAULT_MOMENT_TYPES = ["Award Announcement", "Acceptance Speech", "Crowd Reaction", "Trophy Moment"];

export const SENSITIVITY_PRESETS = {
  conservative: { threshold: 90 },
  balanced: { threshold: 80 },
  aggressive: { threshold: 70 },
} as const;

export interface DetectionSettings {
  sensitivity_mode: "conservative" | "balanced" | "aggressive";
  confidence_threshold: number;
  detection_interval_seconds: number;
  clip_duration_seconds: number;
  clip_before_seconds: number;
  clip_after_seconds: number;
  max_clips_per_stream: number;
  auto_clip_enabled: boolean;
  layers_enabled: { speech: boolean; audio_energy: boolean; visual: boolean; watchlist: boolean };
  moment_types_enabled: string[];
  clip_duration_overrides: Record<string, { before: number; after: number }>;
}

const DEFAULT_SETTINGS: DetectionSettings = {
  sensitivity_mode: "balanced",
  confidence_threshold: 80,
  detection_interval_seconds: 10,
  clip_duration_seconds: 30,
  clip_before_seconds: 15,
  clip_after_seconds: 15,
  max_clips_per_stream: 50,
  auto_clip_enabled: true,
  layers_enabled: { speech: true, audio_energy: true, visual: true, watchlist: true },
  moment_types_enabled: [...DEFAULT_MOMENT_TYPES],
  clip_duration_overrides: {},
};

export function useDetectionSettings() {
  const [settings, setSettings] = useState<DetectionSettings>({ ...DEFAULT_SETTINGS });
  const [loading] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const updateSettings = useCallback((partial: Partial<DetectionSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  }, []);

  const activeLayerCount = Object.values(settings.layers_enabled).filter(Boolean).length;
  const activeTypeCount = settings.moment_types_enabled.length;

  const estimateClipsPerHour = useCallback(() => {
    const base = settings.sensitivity_mode === "aggressive" ? 45 : settings.sensitivity_mode === "balanced" ? 22 : 10;
    const layerMul = activeLayerCount / 4;
    const typeMul = activeTypeCount / ALL_MOMENT_TYPES.length;
    const low = Math.round(base * layerMul * typeMul * 0.7);
    const high = Math.round(base * layerMul * typeMul * 1.3);
    return { low, high };
  }, [settings.sensitivity_mode, activeLayerCount, activeTypeCount]);

  return { settings, loading, savedIndicator, updateSettings, activeLayerCount, activeTypeCount, estimateClipsPerHour };
}
