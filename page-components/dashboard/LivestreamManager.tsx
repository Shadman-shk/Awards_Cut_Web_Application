"use client";

import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StreamRoomsGrid } from "@/components/livestream/StreamRoomsGrid";
import { DetectionSettings } from "@/components/livestream/DetectionSettings";
import { useClipPipeline } from "@/hooks/useClipPipeline";

export default function LivestreamManager() {
  const pipeline = useClipPipeline();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CeremonySelector />
        <SetupStepper />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Livestream Manager</h1>
            <p className="text-muted-foreground">Connect your stream, monitor moments, and generate clips automatically.</p>
          </div>
          {pipeline.readyClipCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
              {pipeline.readyClipCount} clips ready
            </span>
          )}
        </motion.div>

        {/* Stream Rooms */}
        <ErrorBoundary>
          <StreamRoomsGrid pipeline={pipeline} />
        </ErrorBoundary>

        {/* Detection Settings */}
        <DetectionSettings />
      </div>
    </DashboardLayout>
  );
}
