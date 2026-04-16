"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export interface DetectionSettings {
  sensitivity_mode: "conservative" | "balanced" | "aggressive";
  confidence_threshold: number;
  detection_interval_seconds: number;
  clip_duration_seconds: number;
  clip_before_seconds: number;
  clip_after_seconds: number;
  max_clips_per_stream: number;
  auto_clip_enabled: boolean;
  layers_enabled: {
    speech: boolean;
    audio_energy: boolean;
    visual: boolean;
    watchlist: boolean;
  };
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
  moment_types_enabled: [
    "Award Announcement", "Lifetime Achievement", "Rising Star",
    "Acceptance Speech", "Trophy Moment", "Crowd Reaction",
    "Leadership Excellence", "Innovation Award", "Grand Prize",
    "Presentation", "Dramatic Moment", "Community Impact", "Standing Ovation",
  ],
  clip_duration_overrides: {},
};

const ALL_MOMENT_TYPES = [
  "Award Announcement", "Lifetime Achievement", "Rising Star",
  "Acceptance Speech", "Trophy Moment", "Crowd Reaction",
  "Leadership Excellence", "Innovation Award", "Grand Prize",
  "Presentation", "Dramatic Moment", "Introduction",
  "Community Impact", "Normal Conversation", "Standing Ovation",
];

const DEFAULT_MOMENT_TYPES = DEFAULT_SETTINGS.moment_types_enabled;

const SENSITIVITY_PRESETS: Record<DetectionSettings["sensitivity_mode"], { threshold: number }> = {
  conservative: { threshold: 90 },
  balanced: { threshold: 80 },
  aggressive: { threshold: 70 },
};

export { ALL_MOMENT_TYPES, DEFAULT_MOMENT_TYPES, SENSITIVITY_PRESETS };

export function useDetectionSettings() {
  const { user } = useUser();
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount - for now, just use defaults since we don't have database
  useEffect(() => {
    if (!user) return;
    // TODO: Load from database when available
    setLoading(false);
  }, [user]);

  // Debounced save
  const persistSettings = useCallback(
    (newSettings: DetectionSettings) => {
      if (!user) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        // TODO: Save to database when available
        console.log("Saving detection settings:", newSettings);

        setSavedIndicator(true);
        if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
        indicatorTimeoutRef.current = setTimeout(() => setSavedIndicator(false), 1500);
      }, 400);
    },
    [user]
  );

  const updateSettings = useCallback(
    (partial: Partial<DetectionSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  // Computed values
  const activeLayerCount = Object.values(settings.layers_enabled).filter(Boolean).length;
  const activeTypeCount = settings.moment_types_enabled.length;

  const estimateClipsPerHour = useCallback(() => {
    const confidenceFactor = (1 - settings.confidence_threshold / 100) * 2;
    const layersFactor = activeLayerCount / 4;
    const typesFactor = activeTypeCount / ALL_MOMENT_TYPES.length;
    const baseRate = 40;
    const rate = baseRate * confidenceFactor * layersFactor * typesFactor;
    const low = Math.max(1, Math.round(rate * 0.7));
    const high = Math.max(low + 1, Math.round(rate * 1.3));
    return { low, high };
  }, [settings.confidence_threshold, activeLayerCount, activeTypeCount]);

  return {
    settings,
    loading,
    savedIndicator,
    updateSettings,
    activeLayerCount,
    activeTypeCount,
    estimateClipsPerHour,
  };
}