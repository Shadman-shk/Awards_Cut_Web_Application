"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Check, ChevronDown, Minus, Plus, AlertTriangle } from "lucide-react";
// Using basic HTML elements instead of missing UI components
// import { Switch } from "@/components/ui/switch";
// import { Slider } from "@/components/ui/slider";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  useDetectionSettings,
  ALL_MOMENT_TYPES,
  DEFAULT_MOMENT_TYPES,
  SENSITIVITY_PRESETS,
  type DetectionSettings as SettingsType,
} from "@/hooks/useDetectionSettings";

// ─── Sensitivity Cards ───
const SENSITIVITY_OPTIONS: {
  value: SettingsType["sensitivity_mode"];
  icon: string;
  label: string;
  threshold: string;
  gap: string;
  clips: string;
}[] = [
  { value: "conservative", icon: "🎯", label: "Conservative", threshold: "≥90%", gap: "30s min gap", clips: "~5–15 clips/hr" },
  { value: "balanced", icon: "⚖️", label: "Balanced", threshold: "≥80%", gap: "20s min gap", clips: "~15–30 clips/hr" },
  { value: "aggressive", icon: "⚡", label: "Aggressive", threshold: "≥70%", gap: "10s min gap", clips: "~30–60 clips/hr" },
];

const INTERVAL_OPTIONS = [5, 10, 15, 30];
const CLIP_DURATION_OPTIONS = [15, 30, 45, 60];
const CPU_LABELS: Record<number, string> = { 5: "High CPU", 10: "Balanced", 15: "Low CPU", 30: "Minimal CPU" };

const LAYERS = [
  { key: "speech" as const, icon: "🎤", label: "Speech Recognition", desc: "Whisper AI — detects spoken announcements and winner names" },
  { key: "audio_energy" as const, icon: "🔊", label: "Audio Energy", desc: "Web Audio — detects applause & reactions in real time" },
  { key: "visual" as const, icon: "👁", label: "Visual Analysis", desc: "CLIP AI — detects trophies, stage moments, handovers" },
  { key: "watchlist" as const, icon: "★", label: "Award Watchlist", desc: "Custom keywords from your Awards Manager — highest priority" },
];

const OVERRIDE_DEFAULTS: Record<string, { before: number; after: number }> = {
  "Award Announcement": { before: 20, after: 25 },
  "Acceptance Speech": { before: 15, after: 45 },
  "Crowd Reaction": { before: 10, after: 10 },
  "Trophy Moment": { before: 15, after: 15 },
};

export function DetectionSettings() {
  const {
    settings, loading, savedIndicator, updateSettings,
    activeLayerCount, activeTypeCount, estimateClipsPerHour,
  } = useDetectionSettings();
  const [customClip, setCustomClip] = useState(false);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [speechWarning, setSpeechWarning] = useState(false);

  const estimate = estimateClipsPerHour();

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border/50 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-4" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  const cpuPercent = (activeLayerCount / 4) * (settings.detection_interval_seconds <= 10 ? 1 : settings.detection_interval_seconds <= 15 ? 0.6 : 0.3);
  const cpuColor = cpuPercent > 0.7 ? "bg-destructive" : cpuPercent > 0.4 ? "bg-accent" : "bg-green-500";
  const cpuLabel = cpuPercent > 0.7 ? "High CPU" : cpuPercent > 0.4 ? "Moderate CPU" : "Low CPU";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">Detection Settings</h2>
          <p className="text-sm text-muted-foreground">Configure AI moment detection and auto-clipping</p>
        </div>
        <AnimatePresence>
          {savedIndicator && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-green-500 font-medium bg-green-500/10 px-2.5 py-1 rounded-full">
              <Check className="h-3 w-3" /> Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* ROW 1: Sensitivity + Confidence */}
        <div className="space-y-4">
          <span className="text-sm font-medium text-muted-foreground">Sensitivity Mode</span>
          <div className="grid grid-cols-3 gap-3">
            {SENSITIVITY_OPTIONS.map((opt) => {
              const selected = settings.sensitivity_mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateSettings({
                      sensitivity_mode: opt.value,
                      confidence_threshold: SENSITIVITY_PRESETS[opt.value].threshold,
                    });
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all duration-200",
                    selected
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]"
                      : "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
                  )}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className={cn("font-semibold text-sm", selected ? "text-foreground" : "text-muted-foreground")}>{opt.label}</div>
                  <div className={cn("text-xs mt-1", selected ? "text-foreground/70" : "text-muted-foreground/70")}>
                    Confidence {opt.threshold}<br />{opt.gap}<br />{opt.clips}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confidence Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">60% — More moments</span>
              <span className="text-sm font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">{settings.confidence_threshold}%</span>
              <span className="text-sm text-muted-foreground">99% — Fewer, higher quality</span>
            </div>
            <input
              type="range"
              value={settings.confidence_threshold}
              min={60}
              max={99}
              step={1}
              onChange={(e) => updateSettings({ confidence_threshold: Number(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-muted-foreground text-center">
              At {settings.confidence_threshold}% confidence — approx {estimate.low}–{estimate.high} clips per hour
            </p>
          </div>
        </div>

        {/* ROW 2: Timing Controls */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Detection Interval */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">🕐 Scan Every</span>
            <div className="flex rounded-lg overflow-hidden border border-border/50">
              {INTERVAL_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ detection_interval_seconds: v })}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors",
                    settings.detection_interval_seconds === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v}s
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{CPU_LABELS[settings.detection_interval_seconds] || "Balanced"}</p>
          </div>

          {/* Clip Duration */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">🎬 Clip Length</span>
            <div className="flex rounded-lg overflow-hidden border border-border/50">
              {CLIP_DURATION_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setCustomClip(false);
                    const half = Math.floor(v / 2);
                    updateSettings({ clip_duration_seconds: v, clip_before_seconds: half, clip_after_seconds: v - half });
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors",
                    !customClip && settings.clip_duration_seconds === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v}s
                </button>
              ))}
              <button
                onClick={() => setCustomClip(true)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors",
                  customClip ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                Custom
              </button>
            </div>
            {customClip && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Before:</span>
                <input
                  type="number"
                  value={settings.clip_before_seconds}
                  min={5}
                  max={60}
                  onChange={(e) => {
                    const before = Number(e.target.value) || 15;
                    updateSettings({ clip_before_seconds: before, clip_duration_seconds: before + settings.clip_after_seconds });
                  }}
                  className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-center text-foreground"
                />
                <span className="text-muted-foreground">s + After:</span>
                <input
                  type="number"
                  value={settings.clip_after_seconds}
                  min={5}
                  max={60}
                  onChange={(e) => {
                    const after = Number(e.target.value) || 15;
                    updateSettings({ clip_after_seconds: after, clip_duration_seconds: settings.clip_before_seconds + after });
                  }}
                  className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-center text-foreground"
                />
                <span className="text-muted-foreground">s</span>
              </div>
            )}
          </div>

          {/* Max Clips Stepper */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">📊 Max Clips</span>
            <div className="flex items-center gap-0 rounded-lg border border-border/50 overflow-hidden">
              <button
                onClick={() => updateSettings({ max_clips_per_stream: Math.max(0, settings.max_clips_per_stream - 5) })}
                className="px-3 py-2 bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                value={settings.max_clips_per_stream}
                min={0}
                max={500}
                onChange={(e) => updateSettings({ max_clips_per_stream: Math.min(500, Math.max(0, Number(e.target.value) || 0)) })}
                className="flex-1 text-center py-2 bg-transparent text-foreground font-semibold text-sm border-x border-border/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => updateSettings({ max_clips_per_stream: Math.min(500, settings.max_clips_per_stream + 5) })}
                className="px-3 py-2 bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {settings.max_clips_per_stream === 0 ? "Unlimited" : "Per stream session"}
            </p>
          </div>

          {/* Auto-Clip Toggle */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">⚡ Auto-Clip</span>
            <button
              onClick={() => updateSettings({ auto_clip_enabled: !settings.auto_clip_enabled })}
              className={cn(
                "w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border",
                settings.auto_clip_enabled
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border/50"
              )}
            >
              {settings.auto_clip_enabled ? "⊙ Enabled" : "○ Disabled"}
            </button>
            {!settings.auto_clip_enabled && (
              <p className="text-[10px] text-muted-foreground">Moments detected but not clipped automatically</p>
            )}
          </div>
        </div>

        {/* ROW 3: Detection Layers */}
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-foreground">🧠 Active Detection Layers</span>
            <p className="text-xs text-muted-foreground">Disable layers to reduce CPU usage</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {LAYERS.map((layer) => {
              const enabled = settings.layers_enabled[layer.key];
              return (
                <div
                  key={layer.key}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200",
                    enabled
                      ? "border-l-2 border-l-primary border-t-border/50 border-r-border/50 border-b-border/50 bg-card"
                      : "border-border/30 bg-muted/20 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-base", enabled ? "" : "grayscale")}>{layer.icon}</span>
                        <span className={cn("font-medium text-sm", enabled ? "text-foreground" : "text-muted-foreground")}>{layer.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          if (layer.key === "speech" && !e.target.checked) setSpeechWarning(true);
                          else setSpeechWarning(false);
                          updateSettings({
                            layers_enabled: { ...settings.layers_enabled, [layer.key]: e.target.checked },
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          {speechWarning && (
            <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 px-3 py-2 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Speech layer is the most accurate for award announcements — consider keeping it enabled
            </div>
          )}
          {/* CPU Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", cpuColor)} style={{ width: `${Math.round(cpuPercent * 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{cpuLabel} — {activeLayerCount} of 4 layers</span>
          </div>
        </div>

        {/* ROW 4: Moment Types */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">🏆 Moment Types — Auto-Clip</span>
              <p className="text-xs text-muted-foreground">Only selected types will generate clips automatically</p>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => updateSettings({ moment_types_enabled: [...ALL_MOMENT_TYPES] })} className="text-primary hover:underline">Select All</button>
              <span className="text-border">|</span>
              <button onClick={() => updateSettings({ moment_types_enabled: [] })} className="text-muted-foreground hover:underline">Clear All</button>
              <span className="text-border">|</span>
              <button onClick={() => updateSettings({ moment_types_enabled: [...DEFAULT_MOMENT_TYPES] })} className="text-primary hover:underline">Recommended</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_MOMENT_TYPES.map((type) => {
              const selected = settings.moment_types_enabled.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    const next = selected
                      ? settings.moment_types_enabled.filter((t) => t !== type)
                      : [...settings.moment_types_enabled, type];
                    updateSettings({ moment_types_enabled: next });
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:scale-[1.02]",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground border border-border/30"
                  )}
                >
                  {selected ? "✓" : "○"} {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 5: Duration Overrides (Collapsible) */}
        <div>
          <button
            onClick={() => setOverridesOpen(!overridesOpen)}
            className="flex items-center gap-2 text-sm text-primary hover:underline w-full"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", overridesOpen && "rotate-180")} />
            ⏱ Customise clip duration per type
          </button>
          {overridesOpen && (
            <div className="pt-3">
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="grid grid-cols-4 gap-0 text-xs font-medium text-muted-foreground px-4 py-2 bg-muted/30 border-b border-border/30">
                  <span>Moment Type</span>
                  <span className="text-center">Before</span>
                  <span className="text-center">After</span>
                  <span className="text-center">Total</span>
                </div>
                {Object.entries(OVERRIDE_DEFAULTS).map(([type, defaults]) => {
                  const override = settings.clip_duration_overrides[type] || defaults;
                  return (
                    <div key={type} className="grid grid-cols-4 gap-0 items-center px-4 py-2 border-b border-border/20 last:border-0">
                      <span className="text-xs text-foreground">{type}</span>
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={override.before}
                          min={5}
                          max={60}
                          onChange={(e) => {
                            const before = Number(e.target.value) || 15;
                            updateSettings({
                              clip_duration_overrides: {
                                ...settings.clip_duration_overrides,
                                [type]: { ...override, before },
                              },
                            });
                          }}
                          className="w-[52px] bg-muted border border-border rounded px-1.5 py-1 text-center text-xs text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={override.after}
                          min={5}
                          max={60}
                          onChange={(e) => {
                            const after = Number(e.target.value) || 15;
                            updateSettings({
                              clip_duration_overrides: {
                                ...settings.clip_duration_overrides,
                                [type]: { ...override, after },
                              },
                            });
                          }}
                          className="w-[52px] bg-muted border border-border rounded px-1.5 py-1 text-center text-xs text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span className="text-center text-xs text-muted-foreground">{override.before + override.after}s</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => updateSettings({ clip_duration_overrides: {} })}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Reset to defaults
              </button>
            </div>
          )}
        </div>

        {/* FOOTER: Settings Summary */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-xs text-muted-foreground space-y-1">
          <div>
            Current config: <span className="text-foreground font-medium capitalize">{settings.sensitivity_mode}</span> · {settings.confidence_threshold}% threshold · {settings.detection_interval_seconds}s scans
          </div>
          <div>
            Auto-clip {settings.auto_clip_enabled ? "ON" : "OFF"} · {activeLayerCount} layers · {activeTypeCount} moment types · Max {settings.max_clips_per_stream === 0 ? "Unlimited" : settings.max_clips_per_stream} clips
          </div>
          <div className="flex items-center justify-between">
            <span>Estimated output: ~{estimate.low}–{estimate.high} clips per hour</span>
            <AnimatePresence>
              {savedIndicator && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-green-500 font-medium">
                  Saved ✓
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}