"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { useCeremony } from "@/contexts/CeremonyContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Trophy, 
  Video, 
  Users, 
  TrendingUp, 
  Calendar,
  Plus,
  ArrowUpRight,
  Play,
  Radio,
  BarChart3
} from "lucide-react";
import { useEffect, useRef, useState, memo } from "react";

const stats = [
  { label: "Total Awards", value: 127, icon: Trophy, trend: "+12%", color: "text-gold" },
  { label: "Videos Generated", value: 382, icon: Video, trend: "+24%", color: "text-primary" },
  { label: "Winners Reached", value: 98, suffix: "%", icon: Users, trend: "+5%", color: "text-green-500" },
  { label: "Social Shares", value: 1200, display: "1.2K", icon: TrendingUp, trend: "+18%", color: "text-blue-500" },
];

const recentEvents = [
  { name: "Tech Excellence Awards 2024", date: "Jan 15, 2024", status: "completed", awards: 45 },
  { name: "Marketing Innovation Summit", date: "Jan 28, 2024", status: "upcoming", awards: 32 },
  { name: "Design Awards Gala", date: "Feb 10, 2024", status: "upcoming", awards: 28 },
];

const recentVideos = [
  { winner: "Sarah Johnson", category: "Best Innovation", thumbnail: "video1" },
  { winner: "Michael Chen", category: "Leadership Award", thumbnail: "video2" },
  { winner: "Emily Davis", category: "Rising Star", thumbnail: "video3" },
];

/** Animated counter component */
const CountUp = memo(({ target, suffix, display }: { target: number; suffix?: string; display?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (display) { setCount(target); return; }
    const duration = 600;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, display]);

  return (
    <span ref={ref} className="animate-count-up">
      {display || count}{suffix || ""}
    </span>
  );
});
CountUp.displayName = "CountUp";

export default function Dashboard() {
  const router = useRouter();
  const { hasCeremonies } = useCeremony();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        {hasCeremonies && <SetupStepper />}

        {/* Header + Quick Actions — always above the fold */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Here's an overview of your events.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="hero" size="sm" asChild>
              <Link href="/dashboard/livestream">
                <Radio className="h-4 w-4" /> Start Stream
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link href="/dashboard/clip-generation">
                <Video className="h-4 w-4" /> Generate Clips
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="h-4 w-4" /> Analytics
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.06 }}
              className="p-5 rounded-xl bg-card border border-border shadow-card-ac hover:shadow-elevated hover:border-border/80 hover:-translate-y-px transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold text-green-500 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />{stat.trend}
                </span>
              </div>
              <p className="text-[28px] font-semibold text-foreground mb-0.5 tabular-nums">
                <CountUp target={stat.value} suffix={stat.suffix} display={stat.display} />
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.3 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card-ac"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Recent Events</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/awards">
                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/30 hover:border-border/60 hover:bg-muted/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.date} • {event.awards} awards</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                    event.status === "completed" 
                      ? "badge-live" 
                      : "badge-processing"
                  }`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Videos */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.36 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card-ac"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Recent Videos</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/editor">
                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              {recentVideos.map((video) => (
                <div
                  key={video.winner}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/30 group cursor-pointer hover:border-primary/30 hover:-translate-y-px transition-all duration-200"
                >
                  <div className="w-14 h-9 rounded-lg bg-gradient-card flex items-center justify-center relative overflow-hidden">
                    <Play className="h-3.5 w-3.5 text-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-150" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{video.winner}</p>
                    <p className="text-xs text-muted-foreground">{video.category}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={() => router.push("/dashboard/editor")}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.42 }}
          className="p-5 rounded-xl bg-card border border-border shadow-card-ac"
        >
          <h2 className="text-base font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/awards">
                <Trophy className="h-5 w-5" />
                <span className="text-xs">Upload Awards</span>
              </Link>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/branding">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <span className="text-xs">Upload Branding</span>
              </Link>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/templates">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                </svg>
                <span className="text-xs">Choose Template</span>
              </Link>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/livestream">
                <Video className="h-5 w-5" />
                <span className="text-xs">Connect Stream</span>
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
