"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleSkeleton } from "@/components/ui/role-skeleton";
import { AccessDenied } from "@/components/dashboard/AccessDenied";
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Monitor,
  Volume2,
  VolumeX,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

type StreamStatus = "offline" | "connecting" | "live";

interface StreamMetrics {
  bitrate: number;
  fps: number;
  resolution: string;
  droppedFrames: number;
  latency: number;
  audioDetected: boolean;
  lastHeartbeat: Date;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: Date;
}

export default function StreamHealth() {
  const { canViewStreamHealth, isLoading: roleLoading, isRoleResolved } = useUserRole();
  const [status, setStatus] = useState<StreamStatus>("offline");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    bitrate: 0,
    fps: 0,
    resolution: "N/A",
    droppedFrames: 0,
    latency: 0,
    audioDetected: false,
    lastHeartbeat: new Date(),
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isDemo, setIsDemo] = useState(true);

  // Generate demo metrics
  const generateDemoMetrics = (): StreamMetrics => {
    const isLive = status === "live";
    return {
      bitrate: isLive ? Math.floor(4500 + Math.random() * 1500) : 0,
      fps: isLive ? Math.floor(28 + Math.random() * 4) : 0,
      resolution: isLive ? "1920x1080" : "N/A",
      droppedFrames: isLive ? Math.floor(Math.random() * 50) : 0,
      latency: isLive ? Math.floor(150 + Math.random() * 100) : 0,
      audioDetected: isLive ? Math.random() > 0.1 : false,
      lastHeartbeat: new Date(),
    };
  };

  // Generate alerts based on metrics
  const generateAlerts = (metrics: StreamMetrics): Alert[] => {
    const newAlerts: Alert[] = [];
    
    if (status === "live") {
      if (metrics.bitrate < 2000) {
        newAlerts.push({
          id: "low-bitrate",
          type: "warning",
          message: `Low bitrate detected: ${metrics.bitrate} kbps`,
          timestamp: new Date(),
        });
      }
      if (metrics.latency > 200) {
        newAlerts.push({
          id: "high-latency",
          type: "warning",
          message: `High latency: ${metrics.latency}ms`,
          timestamp: new Date(),
        });
      }
      if (!metrics.audioDetected) {
        newAlerts.push({
          id: "no-audio",
          type: "error",
          message: "No audio detected in stream",
          timestamp: new Date(),
        });
      }
      if (metrics.droppedFrames > 30) {
        newAlerts.push({
          id: "dropped-frames",
          type: "warning",
          message: `${metrics.droppedFrames} frames dropped`,
          timestamp: new Date(),
        });
      }
    }
    
    return newAlerts;
  };

  // Simulate live metrics updates
  useEffect(() => {
    if (status === "live" && isDemo) {
      const interval = setInterval(() => {
        const newMetrics = generateDemoMetrics();
        setMetrics(newMetrics);
        setAlerts(generateAlerts(newMetrics));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status, isDemo]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newMetrics = generateDemoMetrics();
    setMetrics(newMetrics);
    setAlerts(generateAlerts(newMetrics));
    
    toast({
      title: "Metrics refreshed",
      description: "Stream health data has been updated.",
    });
    setIsRefreshing(false);
  };

  const simulateStreamStatus = (newStatus: StreamStatus) => {
    setStatus(newStatus);
    if (newStatus === "live") {
      const newMetrics = generateDemoMetrics();
      setMetrics(newMetrics);
      setAlerts(generateAlerts(newMetrics));
    } else {
      setMetrics({
        bitrate: 0,
        fps: 0,
        resolution: "N/A",
        droppedFrames: 0,
        latency: 0,
        audioDetected: false,
        lastHeartbeat: new Date(),
      });
      setAlerts([]);
    }
    toast({
      title: `Stream ${newStatus}`,
      description: `Demo stream is now ${newStatus}.`,
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case "live":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "live":
        return <Wifi className="h-5 w-5" />;
      case "connecting":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      default:
        return <WifiOff className="h-5 w-5" />;
    }
  };

  // Show skeleton while role is loading - NEVER show Access Denied while loading
  if (roleLoading || !isRoleResolved) {
    return (
      <DashboardLayout>
        <RoleSkeleton message="Checking permissions..." />
      </DashboardLayout>
    );
  }

  // Only show Access Denied AFTER role is fully resolved
  if (isRoleResolved && !canViewStreamHealth) {
    return (
      <DashboardLayout>
        <AccessDenied 
          title="Stream Health Access Denied"
          description="You don't have permission to view stream health monitoring."
          requiredRole="staff"
          showRequestAccess
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        <SetupStepper />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stream Health</h1>
            <p className="text-muted-foreground">Monitor your livestream performance in real-time.</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Demo Banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3"
          >
            <Info className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Demo Mode</p>
              <p className="text-xs text-muted-foreground">
                Demo data — connect a real stream to see live stats.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={status === "offline" ? "secondary" : "ghost"}
                onClick={() => simulateStreamStatus("offline")}
              >
                Offline
              </Button>
              <Button 
                size="sm" 
                variant={status === "connecting" ? "secondary" : "ghost"}
                onClick={() => simulateStreamStatus("connecting")}
              >
                Connecting
              </Button>
              <Button 
                size="sm" 
                variant={status === "live" ? "hero" : "ghost"}
                onClick={() => simulateStreamStatus("live")}
              >
                Live
              </Button>
            </div>
          </motion.div>
        )}

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground capitalize">{status}</h2>
                <p className="text-sm text-muted-foreground">
                  Last heartbeat: {metrics.lastHeartbeat.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              status === "live" 
                ? "bg-green-500/20 text-green-500" 
                : status === "connecting"
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {status.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Bitrate", 
              value: `${metrics.bitrate} kbps`, 
              icon: Gauge,
              trend: metrics.bitrate > 4000 ? "up" : metrics.bitrate > 0 ? "down" : null,
              status: metrics.bitrate > 4000 ? "good" : metrics.bitrate > 2000 ? "warning" : "error"
            },
            { 
              label: "FPS", 
              value: `${metrics.fps}`, 
              icon: Activity,
              trend: metrics.fps >= 30 ? "up" : metrics.fps > 0 ? "down" : null,
              status: metrics.fps >= 30 ? "good" : metrics.fps >= 24 ? "warning" : "error"
            },
            { 
              label: "Resolution", 
              value: metrics.resolution, 
              icon: Monitor,
              trend: null,
              status: metrics.resolution === "1920x1080" ? "good" : metrics.resolution !== "N/A" ? "warning" : "error"
            },
            { 
              label: "Dropped Frames", 
              value: `${metrics.droppedFrames}`, 
              icon: AlertTriangle,
              trend: metrics.droppedFrames > 20 ? "down" : null,
              status: metrics.droppedFrames < 10 ? "good" : metrics.droppedFrames < 30 ? "warning" : "error"
            },
            { 
              label: "Latency", 
              value: `${metrics.latency}ms`, 
              icon: Clock,
              trend: metrics.latency > 200 ? "down" : metrics.latency > 0 ? "up" : null,
              status: metrics.latency < 150 ? "good" : metrics.latency < 250 ? "warning" : "error"
            },
            { 
              label: "Audio", 
              value: metrics.audioDetected ? "Detected" : "No Audio", 
              icon: metrics.audioDetected ? Volume2 : VolumeX,
              trend: null,
              status: metrics.audioDetected ? "good" : status === "live" ? "error" : "error"
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`h-5 w-5 ${
                  metric.status === "good" ? "text-green-500" :
                  metric.status === "warning" ? "text-yellow-500" :
                  "text-muted-foreground"
                }`} />
                {metric.trend && (
                  metric.trend === "up" 
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Alerts</h2>
          </div>

          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-500 font-medium">
                {status === "live" ? "All systems healthy" : "No active stream"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    alert.type === "error" 
                      ? "bg-destructive/10 border-destructive/20" 
                      : alert.type === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-primary/10 border-primary/20"
                  }`}
                >
                  <AlertTriangle className={`h-5 w-5 ${
                    alert.type === "error" 
                      ? "text-destructive" 
                      : alert.type === "warning"
                      ? "text-yellow-500"
                      : "text-primary"
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      alert.type === "error" 
                        ? "text-destructive" 
                        : alert.type === "warning"
                        ? "text-yellow-500"
                        : "text-primary"
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
