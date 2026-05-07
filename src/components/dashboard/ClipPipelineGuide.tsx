/**
 * Premium 4-step pipeline guide shown on Clip Generation when no real
 * Livepeer clips exist yet. Walks the user through the exact order:
 * Awards → Templates → Branding → Livestream → AI clips.
 *
 * Each step is self-checking against Supabase counts so the user sees
 * concrete progress instead of a generic empty state.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Palette, Sparkles, Radio, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface StepStatus {
  awardsCount: number;
  templateExists: boolean;
  brandingApplied: boolean;
  liveRoomsCount: number;
}

const STEPS = [
  {
    key: "awards",
    title: "1. Add award winners",
    description: "Enter recipient names and categories so AI knows who to clip.",
    icon: Trophy,
    href: "/dashboard/awards",
    cta: "Add awards",
  },
  {
    key: "templates",
    title: "2. Choose a template",
    description: "Pick a clip layout and motion preset for all winners.",
    icon: Sparkles,
    href: "/dashboard/templates",
    cta: "Choose template",
  },
  {
    key: "branding",
    title: "3. Apply branding & logo",
    description: "Upload your logo, set colors and music — burned into every clip.",
    icon: Palette,
    href: "/dashboard/branding",
    cta: "Set up branding",
  },
  {
    key: "stream",
    title: "4. Go live & let AI monitor",
    description: "Start the RTMP stream — clips appear here automatically per winner.",
    icon: Radio,
    href: "/dashboard/livestream",
    cta: "Open Livestream",
  },
] as const;

export function ClipPipelineGuide() {
  const [status, setStatus] = useState<StepStatus>({
    awardsCount: 0,
    templateExists: false,
    brandingApplied: false,
    liveRoomsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const [awardsRes, roomsRes] = await Promise.all([
        supabase.from("award_categories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("stream_rooms").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("deleted_at", null),
      ]);
      // Branding lives in localStorage
      let brandingApplied = false;
      try {
        const raw = window.localStorage.getItem("awardscut.branding.v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          brandingApplied = !!(parsed?.appliedAt || parsed?.logoUrl);
        }
      } catch {/* noop */}

      if (cancelled) return;
      setStatus({
        awardsCount: awardsRes.count ?? 0,
        templateExists: true, // templates are presets in this app — always available
        brandingApplied,
        liveRoomsCount: roomsRes.count ?? 0,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const isComplete = (key: string) => {
    if (key === "awards") return status.awardsCount > 0;
    if (key === "templates") return status.templateExists;
    if (key === "branding") return status.brandingApplied;
    if (key === "stream") return status.liveRoomsCount > 0;
    return false;
  };

  const completedCount = STEPS.filter((s) => isComplete(s.key)).length;
  const progressPct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card"
    >
      {/* Premium gradient header */}
      <div
        className="relative px-8 py-10 border-b border-border/50"
        style={{
          background:
            "radial-gradient(1200px circle at 0% 0%, hsl(var(--primary) / 0.18), transparent 50%), radial-gradient(800px circle at 100% 100%, hsl(var(--primary) / 0.08), transparent 50%)",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Premium clip pipeline
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              No clips yet — let's set up your ceremony
            </h2>
            <p className="text-muted-foreground mt-2">
              Follow these 4 steps in order. Once your stream is live, AI monitors every
              announcement and creates 16:9, 1:1 and 9:16 clips automatically per winner.
            </p>
          </div>

          {/* Circular progress */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90">
                <circle cx="40" cy="40" r="34" strokeWidth="6" className="fill-none stroke-muted" />
                <circle
                  cx="40" cy="40" r="34" strokeWidth="6"
                  className="fill-none stroke-primary transition-all duration-700"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - completedCount / STEPS.length)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{progressPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{completedCount} / {STEPS.length}</p>
              <p className="text-xs text-muted-foreground">steps done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40">
        {STEPS.map((step, i) => {
          const done = isComplete(step.key);
          const Icon = step.icon;
          // Next step = first incomplete
          const isNext = !done && STEPS.slice(0, i).every((s) => isComplete(s.key));
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative bg-card p-5 flex flex-col ${isNext ? "ring-2 ring-inset ring-primary/40" : ""}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 ml-auto shrink-0" />
                )}
              </div>
              <h3 className={`font-semibold mb-1 ${done ? "text-foreground" : "text-foreground"}`}>
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                {step.description}
              </p>
              {step.key === "awards" && status.awardsCount > 0 && (
                <p className="text-xs text-primary font-medium mb-2">
                  ✓ {status.awardsCount} winner{status.awardsCount === 1 ? "" : "s"} added
                </p>
              )}
              {step.key === "stream" && status.liveRoomsCount > 0 && (
                <p className="text-xs text-primary font-medium mb-2">
                  ✓ {status.liveRoomsCount} stream room{status.liveRoomsCount === 1 ? "" : "s"} ready
                </p>
              )}
              <Button
                asChild
                variant={isNext ? "hero" : done ? "secondary" : "outline"}
                size="sm"
                className="w-full"
              >
                <Link to={step.href}>
                  {done ? "Manage" : step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {!loading && completedCount === STEPS.length && (
        <div className="px-8 py-4 bg-primary/8 border-t border-border/50 text-sm text-foreground">
          <strong className="text-primary">All set.</strong> Start your livestream — clips
          will land here the moment AI detects each winner.
        </div>
      )}
    </motion.div>
  );
}
