"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  Video, 
  Share2, 
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  RefreshCw,
  BarChart2,
  Eye,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Views", value: "12,847", change: "+18%", isPositive: true, icon: Eye },
  { label: "Social Shares", value: "3,241", change: "+24%", isPositive: true, icon: Share2 },
  { label: "Downloads", value: "892", change: "+12%", isPositive: true, icon: Download },
  { label: "Delivery Rate", value: "98%", change: "+5%", isPositive: true, icon: CheckCircle },
];

const recentActivity = [
  { event: "Video viewed", user: "Sarah Johnson", time: "2 min ago" },
  { event: "Video shared on LinkedIn", user: "Michael Chen", time: "15 min ago" },
  { event: "Video downloaded", user: "Emily Davis", time: "1 hour ago" },
  { event: "Video viewed", user: "James Wilson", time: "2 hours ago" },
  { event: "Video shared on Twitter", user: "Maria Garcia", time: "3 hours ago" },
];

const topWinners = [
  { winner: "Sarah Johnson", category: "Best Innovation", views: 2341, shares: 456, deliveryStatus: "delivered" },
  { winner: "Michael Chen", category: "Leadership Award", views: 1892, shares: 324, deliveryStatus: "delivered" },
  { winner: "Emily Davis", category: "Rising Star", views: 1567, shares: 289, deliveryStatus: "delivered" },
  { winner: "James Wilson", category: "Excellence in Design", views: 1234, shares: 198, deliveryStatus: "pending" },
];

const dateRanges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "12m" },
  { label: "All time", value: "all" },
];

const groupByOptions = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

export default function Analytics() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExport = () => {
    const csvContent = [
      ["Metric", "Value", "Change"],
      ...stats.map(s => [s.label, s.value, s.change]),
      [],
      ["Top Winners"],
      ["Winner", "Category", "Views", "Shares", "Status"],
      ...topWinners.map(v => [v.winner, v.category, v.views.toString(), v.shares.toString(), v.deliveryStatus])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete!",
      description: "Analytics data has been exported as CSV.",
    });
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedRange(value);
    toast({
      title: "Date range updated",
      description: `Now showing data for ${dateRanges.find(r => r.value === value)?.label}.`,
    });
  };

  const handleGroupByChange = (value: string) => {
    setGroupBy(value);
    toast({
      title: "Grouping updated",
      description: `Data grouped by ${value}.`,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast({
      title: "Analytics refreshed",
      description: "Data has been updated with latest stats.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        <SetupStepper />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track ceremony performance and winner engagement.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <BarChart2 className="h-5 w-5" />
                  {groupByOptions.find(g => g.value === groupBy)?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {groupByOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => handleGroupByChange(option.value)}
                    className={groupBy === option.value ? "bg-muted" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Calendar className="h-5 w-5" />
                  {dateRanges.find(r => r.value === selectedRange)?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {dateRanges.map((range) => (
                  <DropdownMenuItem 
                    key={range.value}
                    onClick={() => handleDateRangeChange(range.value)}
                    className={selectedRange === range.value ? "bg-muted" : ""}
                  >
                    {range.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-5 w-5" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  stat.isPositive ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Views Over Time</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 88].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex-1 bg-gradient-terracotta rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-charcoal rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {Math.round(height * 150)} views
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </motion.div>

          {/* Top Winners - Ceremony Deep Dive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Ceremony Deep Dive</h2>
            <div className="space-y-4">
              {topWinners.map((winner, index) => (
                <motion.div 
                  key={winner.winner}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-terracotta flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{winner.winner}</p>
                    <p className="text-sm text-muted-foreground">{winner.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{winner.views.toLocaleString()} views</p>
                    <p className="text-sm text-muted-foreground">{winner.shares} shares</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    winner.deliveryStatus === "delivered"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-gold/20 text-gold"
                  }`}>
                    {winner.deliveryStatus}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{activity.user}</span>
                      {" "}{activity.event.toLowerCase()}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
