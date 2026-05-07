import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { useCeremony } from "@/contexts/CeremonyContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StreamRoomsGrid } from "@/components/livestream/StreamRoomsGrid";
import { AwardsControlPanel } from "@/components/livestream/AwardsControlPanel";
import { LiveClipQueue } from "@/components/livestream/LiveClipQueue";
import { LiveTranscriptPanel } from "@/components/livestream/LiveTranscriptPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useClipPipeline } from "@/hooks/useClipPipeline";
import { useStreamRooms } from "@/hooks/useStreamRooms";
import { supabase } from "@/integrations/supabase/client";

const DetectionSettings = lazy(() => import("@/components/livestream/DetectionSettings").then((m) => ({ default: m.DetectionSettings })));
const AISuggestionsPanel = lazy(() => import("@/components/livestream/AISuggestionsPanel").then((m) => ({ default: m.AISuggestionsPanel })));
const ManualTriggerPanel = lazy(() => import("@/components/livestream/ManualTriggerPanel").then((m) => ({ default: m.ManualTriggerPanel })));

export default function LivestreamManager() {
  const { updateCeremonyProgress } = useCeremony();
  const pipeline = useClipPipeline();
  const streamRooms = useStreamRooms();
  const { rooms } = streamRooms;
  const liveRoom = rooms.find((r) => r.status === "live" || r.status === "monitoring") ?? null;
  const liveRoomId = liveRoom?.id ?? null;
  const isMonitoringRoom = liveRoom?.status === "monitoring";
  const transcribeStartedAt = useRef<number | null>(null);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [aiDetectionEnabled, setAiDetectionEnabled] = useState(true);
  const [aiThreshold, setAiThreshold] = useState(0.8);

  useEffect(() => {
    if (rooms.length > 0) updateCeremonyProgress("livestream", true);
  }, [rooms.length, updateCeremonyProgress]);

  // Server-side pg_cron is the source of truth for transcription. Browser tick = redundancy.
  useEffect(() => {
    if (!liveRoomId || !isMonitoringRoom) {
      transcribeStartedAt.current = null;
      return;
    }
    transcribeStartedAt.current = Date.now();
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (!aiDetectionEnabled) return;
      try {
        const { data } = await supabase.functions.invoke("transcribe-stream", { body: { roomId: liveRoomId } });
        if (!cancelled && (data?.success || data?.skipped)) {
          await supabase.functions.invoke("detect-winner", { body: { roomId: liveRoomId, autoFireThreshold: aiThreshold } });
        }
      } catch (e) {
        console.warn("transcribe-stream browser tick failed (server cron will continue)", e);
      }
    };
    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [liveRoomId, isMonitoringRoom, aiDetectionEnabled, aiThreshold]);

  const getPlayheadSeconds = () => {
    const startedAt = liveRoom?.started_at ? new Date(liveRoom.started_at).getTime() : transcribeStartedAt.current;
    if (!startedAt || Number.isNaN(startedAt)) return 0;
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CeremonySelector />
        <SetupStepper />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Livestream Manager</h1>
            <p className="text-muted-foreground">
              Mark each winner the moment they're announced. We auto-clip, brand, and deliver in real time.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="approval-gate" checked={approvalRequired} onCheckedChange={setApprovalRequired} />
              <Label htmlFor="approval-gate" className="text-sm text-foreground cursor-pointer">
                Approval gate
              </Label>
            </div>
            {pipeline.readyClipCount > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                {pipeline.readyClipCount} clips ready
              </span>
            )}
          </div>
        </motion.div>

        {/* Main two-column: Stream (left) + Awards Control (right sticky) */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <ErrorBoundary>
              <StreamRoomsGrid pipeline={pipeline} {...streamRooms} />
            </ErrorBoundary>

            {/* Live Transcript collapsible under stream */}
            <ErrorBoundary>
              <LiveTranscriptPanel streamRoomId={liveRoomId} />
            </ErrorBoundary>

            {/* Clip Queue under the stream */}
            <ErrorBoundary>
              <LiveClipQueue approvalRequired={approvalRequired} />
            </ErrorBoundary>
          </div>

          <div className="xl:sticky xl:top-20">
            <ErrorBoundary>
              <AwardsControlPanel
                streamRoomId={liveRoomId}
                getPlayheadSeconds={getPlayheadSeconds}
                aiEnabled={aiDetectionEnabled}
                setAiEnabled={setAiDetectionEnabled}
                aiThreshold={aiThreshold}
                setAiThreshold={setAiThreshold}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Secondary AI tools — collapsed by default */}
        <div className="rounded-2xl bg-card border border-border/50">
          <button
            onClick={() => setAiToolsOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-2xl"
          >
            <div>
              <h3 className="text-base font-semibold text-foreground">AI assist tools</h3>
              <p className="text-xs text-muted-foreground">Optional: AI suggestions and free-form manual trigger</p>
            </div>
            {aiToolsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {aiToolsOpen && (
            <div className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={null}>
                <ErrorBoundary>
                  <AISuggestionsPanel streamRoomId={liveRoomId} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <ManualTriggerPanel streamRoomId={liveRoomId} getPlayheadSeconds={getPlayheadSeconds} />
                </ErrorBoundary>
              </Suspense>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/50">
          <button
            onClick={() => setAdvancedSettingsOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Advanced detection settings</h3>
                <p className="text-xs text-muted-foreground">Optional tuning for scan interval, confidence, and clip length</p>
              </div>
            </div>
            {advancedSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {advancedSettingsOpen && (
            <div className="p-4 pt-0">
              <Suspense fallback={null}>
                <DetectionSettings />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
