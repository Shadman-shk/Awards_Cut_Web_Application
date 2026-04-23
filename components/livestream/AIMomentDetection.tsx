"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface DetectedMomentItem {
  id: string;
  timestamp: string;
  type: string;
  confidence: number;
  icon: string;
}

interface AIMomentDetectionProps {
  isScanning: boolean;
  scanProgress: number;
  moments: DetectedMomentItem[];
  scanComplete: boolean;
}

export function AIMomentDetection({ isScanning, scanProgress, moments, scanComplete }: AIMomentDetectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">AI Moment Detection</h2>
          <p className="text-sm text-muted-foreground">
            {isScanning ? "Scanning video for key moments..." : scanComplete ? `${moments.length} moments detected` : "Waiting to start..."}
          </p>
        </div>
        {isScanning && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-semibold"
          >
            <Sparkles className="h-4 w-4" /> AI ACTIVE
          </motion.div>
        )}
        {scanComplete && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-500 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Complete
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing video timeline...
            </span>
            <span className="text-foreground font-mono">{scanProgress}%</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {moments.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl flex-shrink-0">{moment.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{moment.type}</p>
                <p className="text-sm text-muted-foreground font-mono">{moment.timestamp}</p>
              </div>
              <div className="flex-shrink-0">
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  moment.confidence >= 90 ? "bg-green-500/20 text-green-400" :
                  moment.confidence >= 80 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>
                  {moment.confidence}%
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {moments.length === 0 && !isScanning && (
          <div className="text-center py-8 text-muted-foreground">
            No moments detected yet. Upload a video and click "Process with AI Detection".
          </div>
        )}
      </div>
    </motion.div>
  );
}
