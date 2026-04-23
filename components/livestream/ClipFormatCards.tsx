"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Film, Smartphone, Loader2, CheckCircle2, Play, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClipFormat {
  id: string;
  title: string;
  description: string;
  duration: string;
  aspectRatio: string;
  icon: React.ReactNode;
  emoji: string;
}

const CLIP_FORMATS: ClipFormat[] = [
  {
    id: "winner",
    title: "Winner Moment Clip",
    description: "Captures the name announcement + reaction",
    duration: "15–30 sec",
    aspectRatio: "16:9",
    icon: <Trophy className="h-6 w-6" />,
    emoji: "🏆",
  },
  {
    id: "highlight",
    title: "Highlight Reel",
    description: "Best 4–5 moments stitched together",
    duration: "60–90 sec",
    aspectRatio: "16:9",
    icon: <Film className="h-6 w-6" />,
    emoji: "🎬",
  },
  {
    id: "social",
    title: "Social Short",
    description: "Most emotional moment for Instagram/TikTok",
    duration: "15 sec",
    aspectRatio: "9:16",
    icon: <Smartphone className="h-6 w-6" />,
    emoji: "📱",
  },
];

type ClipState = "idle" | "generating" | "ready";

export function ClipFormatCards() {
  const [clipStates, setClipStates] = useState<Record<string, ClipState>>({
    winner: "idle",
    highlight: "idle",
    social: "idle",
  });

  const handleGenerate = async (formatId: string) => {
    setClipStates((prev) => ({ ...prev, [formatId]: "generating" }));
    const delay = formatId === "highlight" ? 5000 : 3000;
    await new Promise((r) => setTimeout(r, delay));
    setClipStates((prev) => ({ ...prev, [formatId]: "ready" }));
    const format = CLIP_FORMATS.find((f) => f.id === formatId);
    toast({ title: `${format?.emoji} Clip Ready!`, description: `${format?.title} has been generated.` });
  };

  const handleDownload = (formatId: string) => {
    const format = CLIP_FORMATS.find((f) => f.id === formatId);
    const blob = new Blob(["mock clip data"], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${format?.title.replace(/\s+/g, "_")}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: `${format?.title}` });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Film className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Suggested Clip Formats</h2>
          <p className="text-sm text-muted-foreground">3 formats tailored for award ceremonies</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {CLIP_FORMATS.map((format, i) => {
          const state = clipStates[format.id];
          return (
            <motion.div
              key={format.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="p-4 rounded-xl bg-muted/50 border border-border/30 flex flex-col"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border/20 flex items-center justify-center mb-4">
                {state === "ready" ? (
                  <Play className="h-8 w-8 text-primary" />
                ) : (
                  <span className="text-3xl">{format.emoji}</span>
                )}
              </div>

              <h3 className="font-bold text-foreground mb-1">{format.emoji} {format.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 flex-1">{format.description}</p>

              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{format.duration}</span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{format.aspectRatio}</span>
              </div>

              {state === "idle" && (
                <Button variant="hero" className="w-full" onClick={() => handleGenerate(format.id)}>
                  Generate Clip
                </Button>
              )}
              {state === "generating" && (
                <Button variant="hero" className="w-full" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </Button>
              )}
              {state === "ready" && (
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => handleDownload(format.id)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
