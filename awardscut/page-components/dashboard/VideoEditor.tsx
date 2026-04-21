"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Scissors,
  Download,
  Share2,
  Send,
  Music,
  Type,
  Image,
  Layers,
  RotateCcw,
  RotateCw,
  Maximize,
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  FileVideo,
  Monitor,
  Smartphone,
  Square
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Social media icons as simple components
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const videoClips = [
  { id: "1", winner: "Sarah Johnson", category: "Best Innovation", duration: "0:32", status: "ready", email: "sarah@example.com", phone: "+1234567890" },
  { id: "2", winner: "Michael Chen", category: "Leadership Award", duration: "0:28", status: "ready", email: "michael@example.com", phone: "+1234567891" },
  { id: "3", winner: "Emily Davis", category: "Rising Star", duration: "0:30", status: "processing", email: "emily@example.com", phone: "+1234567892" },
];

const exportFormats = [
  { id: "landscape", ratio: "16:9", name: "Landscape", icon: Monitor, description: "YouTube, Website" },
  { id: "square", ratio: "1:1", name: "Square", icon: Square, description: "Instagram Feed, Facebook" },
  { id: "vertical", ratio: "9:16", name: "Vertical", icon: Smartphone, description: "TikTok, Reels, Stories" },
  { id: "twitter", ratio: "16:9", name: "Twitter/X", icon: TwitterIcon, description: "Optimized for X" },
];

const qualityOptions = [
  { id: "1080p", name: "1080p HD", description: "Best quality" },
  { id: "720p", name: "720p", description: "Balanced" },
  { id: "480p", name: "480p", description: "Smaller file" },
];

const socialPlatforms = [
  { id: "tiktok", name: "TikTok", icon: TikTokIcon, color: "bg-black hover:bg-gray-900" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90" },
  { id: "youtube", name: "YouTube", icon: YouTubeIcon, color: "bg-red-600 hover:bg-red-700" },
  { id: "twitter", name: "X (Twitter)", icon: TwitterIcon, color: "bg-black hover:bg-gray-900" },
  { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "bg-blue-600 hover:bg-blue-700" },
  { id: "facebook", name: "Facebook", icon: FacebookIcon, color: "bg-blue-500 hover:bg-blue-600" },
];

export default function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState(videoClips[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(32);
  const [volume, setVolume] = useState(75);

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Export settings
  const [selectedFormat, setSelectedFormat] = useState("landscape");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["landscape"]);

  // Send settings
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportProgress(i);
    }

    setIsExporting(false);
    setIsExportModalOpen(false);
    setExportProgress(0);

    toast({
      title: "Export complete!",
      description: `${selectedFormats.length} video format(s) exported successfully in ${selectedQuality}.`,
    });
  };

  const handleShare = (platform: string) => {
    toast({
      title: `Sharing to ${platform}`,
      description: "Opening share dialog...",
    });
    // Simulate opening share dialog
    setTimeout(() => {
      toast({
        title: "Ready to share!",
        description: `Your video is ready to be shared on ${platform}.`,
      });
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://awardscut.com/video/${selectedClip.id}`);
    toast({
      title: "Link copied!",
      description: "Video link has been copied to clipboard.",
    });
  };

  const handleSendToWinner = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSending(false);
    setIsSendModalOpen(false);

    const methods = [];
    if (sendEmail) methods.push("email");
    if (sendSMS) methods.push("SMS");

    toast({
      title: "Video sent!",
      description: `Video has been sent to ${selectedClip.winner} via ${methods.join(" and ")}.`,
    });
  };

  const toggleFormatSelection = (formatId: string) => {
    if (selectedFormats.includes(formatId)) {
      setSelectedFormats(selectedFormats.filter(f => f !== formatId));
    } else {
      setSelectedFormats([...selectedFormats, formatId]);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Video Editor</h1>
            <p className="text-muted-foreground">Edit and export your award highlight videos.</p>
          </div>
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
                <Download className="h-5 w-5" />
                Export
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="h-5 w-5" />
                Share
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="hero" onClick={() => setIsSendModalOpen(true)}>
                <Send className="h-5 w-5" />
                Send to Winner
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-3 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-card border border-border/50 overflow-hidden"
            >
              {/* Video Player */}
              <div className="aspect-video bg-charcoal relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 cursor-pointer"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-10 w-10 text-primary" />
                      ) : (
                        <Play className="h-10 w-10 text-primary ml-1" />
                      )}
                    </motion.div>
                    <p className="text-lg font-bold text-foreground">{selectedClip.winner}</p>
                    <p className="text-muted-foreground">{selectedClip.category}</p>
                  </div>
                </div>

                {/* Fullscreen button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-charcoal/50 hover:bg-charcoal"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>

              {/* Controls */}
              <div className="p-4 bg-muted/50">
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-12">{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-2 rounded-full bg-border overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = x / rect.width;
                        setCurrentTime(Math.floor(percentage * duration));
                      }}
                    >
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={false}
                        animate={{ width: `${(currentTime / duration) * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)}>
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="hero"
                      size="icon"
                      className="w-12 h-12"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentTime(duration)}>
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <div 
                        className="w-24 h-2 rounded-full bg-border cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          setVolume(Math.floor((x / rect.width) * 100));
                        }}
                      >
                        <div 
                          className="h-full bg-primary rounded-full transition-all" 
                          style={{ width: `${volume}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Timeline</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Scissors className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Timeline tracks */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">Video</span>
                  <div className="flex-1 h-10 rounded-lg bg-gradient-terracotta relative overflow-hidden">
                    <motion.div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">Audio</span>
                  <div className="flex-1 h-6 rounded-lg bg-blue-500/50 relative overflow-hidden">
                    <motion.div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">Music</span>
                  <div className="flex-1 h-6 rounded-lg bg-green-500/50 relative overflow-hidden">
                    <motion.div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-4">
            {/* Clips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-medium text-foreground mb-4">Video Clips</h3>
              <div className="space-y-2">
                {videoClips.map((clip) => (
                  <motion.div
                    key={clip.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedClip(clip)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedClip.id === clip.id
                        ? "bg-primary/20 border border-primary/50"
                        : "bg-muted/50 border border-border/30 hover:border-border"
                    }`}
                  >
                    <p className="font-medium text-foreground text-sm">{clip.winner}</p>
                    <p className="text-xs text-muted-foreground">{clip.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{clip.duration}</span>
                      <span className={`text-xs font-medium ${
                        clip.status === "ready" ? "text-green-500" : "text-gold"
                      }`}>
                        {clip.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tools */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-medium text-foreground mb-4">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Type, label: "Text" },
                  { icon: Image, label: "Image" },
                  { icon: Music, label: "Music" },
                  { icon: Layers, label: "Layers" },
                ].map((tool) => (
                  <motion.div key={tool.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="secondary" className="w-full h-auto py-3 flex-col gap-1">
                      <tool.icon className="h-5 w-5" />
                      <span className="text-xs">{tool.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Export formats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-medium text-foreground mb-4">Export Formats</h3>
              <div className="space-y-2">
                {exportFormats.slice(0, 3).map((format) => (
                  <motion.div
                    key={format.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedFormat(format.id);
                      setSelectedFormats([format.id]);
                      setIsExportModalOpen(true);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {format.ratio}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-foreground">{format.name}</span>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileVideo className="h-5 w-5 text-primary" />
              Export Video
            </DialogTitle>
            <DialogDescription>
              Choose formats and quality for your export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Format Selection */}
            <div>
              <Label className="text-foreground mb-3 block">Select Formats</Label>
              <div className="grid grid-cols-2 gap-3">
                {exportFormats.map((format) => (
                  <motion.div
                    key={format.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleFormatSelection(format.id)}
                    className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedFormats.includes(format.id)
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{format.ratio}</span>
                      {selectedFormats.includes(format.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{format.name}</p>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
            <div>
              <Label className="text-foreground mb-3 block">Quality</Label>
              <div className="flex gap-2">
                {qualityOptions.map((quality) => (
                  <motion.button
                    key={quality.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedQuality(quality.id)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      selectedQuality === quality.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{quality.name}</p>
                    <p className="text-xs text-muted-foreground">{quality.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Export Progress */}
            <AnimatePresence>
              {isExporting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Exporting...</span>
                    <span className="text-sm text-primary font-medium">{exportProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={handleExport}
                disabled={isExporting || selectedFormats.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export {selectedFormats.length} Format{selectedFormats.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Share2 className="h-5 w-5 text-primary" />
              Share Video
            </DialogTitle>
            <DialogDescription>
              Share to social media or copy the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Social Platforms */}
            <div>
              <Label className="text-foreground mb-3 block">Share to Social Media</Label>
              <div className="grid grid-cols-3 gap-3">
                {socialPlatforms.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(platform.name)}
                    className={`p-4 rounded-xl ${platform.color} text-white flex flex-col items-center gap-2 transition-all`}
                  >
                    <platform.icon />
                    <span className="text-xs font-medium">{platform.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Copy Link */}
            <div>
              <Label className="text-foreground mb-3 block">Or Copy Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={`https://awardscut.com/video/${selectedClip.id}`}
                  readOnly
                  className="bg-muted border-border/50 text-muted-foreground"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <Label className="text-foreground mb-3 block">Embed Code</Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <code className="text-xs text-muted-foreground break-all">
                  {`<iframe src="https://awardscut.com/embed/${selectedClip.id}" width="560" height="315" frameborder="0"></iframe>`}
                </code>
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
                navigator.clipboard.writeText(`<iframe src="https://awardscut.com/embed/${selectedClip.id}" width="560" height="315" frameborder="0"></iframe>`);
                toast({ title: "Embed code copied!" });
              }}>
                <Copy className="h-3 w-3 mr-1" />
                Copy embed code
              </Button>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setIsShareModalOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Winner Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Send className="h-5 w-5 text-primary" />
              Send to Winner
            </DialogTitle>
            <DialogDescription>
              Send the video directly to {selectedClip.winner}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Winner Info */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <p className="font-medium text-foreground">{selectedClip.winner}</p>
              <p className="text-sm text-muted-foreground">{selectedClip.category}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {selectedClip.email}
                </span>
              </div>
            </div>

            {/* Delivery Methods */}
            <div>
              <Label className="text-foreground mb-3 block">Delivery Method</Label>
              <div className="space-y-2">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`p-3 rounded-xl cursor-pointer border-2 flex items-center gap-3 transition-all ${
                    sendEmail ? "border-primary bg-primary/10" : "border-border/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    sendEmail ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {sendEmail && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">{selectedClip.email}</p>
                  </div>
                </motion.div>

                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSendSMS(!sendSMS)}
                  className={`p-3 rounded-xl cursor-pointer border-2 flex items-center gap-3 transition-all ${
                    sendSMS ? "border-primary bg-primary/10" : "border-border/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    sendSMS ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {sendSMS && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">SMS</p>
                    <p className="text-xs text-muted-foreground">{selectedClip.phone}</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="message" className="text-foreground mb-2 block">
                Custom Message (optional)
              </Label>
              <textarea
                id="message"
                placeholder="Add a personal message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full h-20 p-3 rounded-xl bg-muted border border-border/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsSendModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={handleSendToWinner}
                disabled={isSending || (!sendEmail && !sendSMS)}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
