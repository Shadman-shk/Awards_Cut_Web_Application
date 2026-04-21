"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  Image, 
  Type, 
  Palette, 
  Music, 
  Check,
  X,
  Eye,
  Loader2,
  Play,
  Pause,
  Trash2,
  Sparkles
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: string;
  url?: string;
}

export default function BrandingManager() {
  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#B5553A");
  const [secondaryColor, setSecondaryColor] = useState("#D4A853");
  const [fontFamily, setFontFamily] = useState("Space Grotesk");
  const [musicTrack, setMusicTrack] = useState<UploadedFile | null>(null);
  const [selectedLibraryTrack, setSelectedLibraryTrack] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<"logo" | "music" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const secondaryColorRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, or SVG file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading("logo");
    
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const fileUrl = URL.createObjectURL(file);
    setLogo({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      url: fileUrl,
    });
    
    setIsUploading(null);
    toast({
      title: "Logo uploaded successfully!",
      description: "Your logo has been added to your branding.",
    });
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    toast({
      title: "Logo removed",
      description: "Your logo has been removed from branding.",
    });
  };

  const handleMusicClick = () => {
    musicInputRef.current?.click();
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or M4A file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading("music");
    setSelectedLibraryTrack(null);
    
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setMusicTrack({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });
    
    setIsUploading(null);
    toast({
      title: "Music uploaded successfully!",
      description: "Your background music has been added.",
    });
  };

  const handleRemoveMusic = () => {
    setMusicTrack(null);
    setSelectedLibraryTrack(null);
    setIsPlaying(false);
    if (musicInputRef.current) musicInputRef.current.value = "";
    toast({
      title: "Music removed",
      description: "Background music has been removed.",
    });
  };

  const handleSelectLibraryTrack = (track: string) => {
    setSelectedLibraryTrack(track);
    setMusicTrack({
      name: `${track}.mp3`,
      size: "Royalty-Free",
    });
    toast({
      title: `${track} track selected`,
      description: "Royalty-free music has been added to your branding.",
    });
  };

  const handleColorClick = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSaving(false);
    toast({
      title: "Branding saved!",
      description: "Your branding settings have been applied to all videos.",
    });
  };

  const handlePreview = () => {
    toast({
      title: "Preview loading...",
      description: "Opening branding preview in a new window.",
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const }
    }),
    hover: {
      y: -4,
      boxShadow: "0 20px 40px -15px rgba(181, 85, 58, 0.2)",
      transition: { duration: 0.2 }
    }
  };

  const uploadZoneVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02, borderColor: "hsl(var(--primary))" },
    tap: { scale: 0.98 }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        <SetupStepper />
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Branding Manager
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-6 w-6 text-gold" />
              </motion.span>
            </h1>
            <p className="text-muted-foreground">Customize your video branding and assets.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePreview} className="group">
              <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Preview
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            className="p-6 rounded-2xl bg-card border border-border/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Logo</h2>
                <p className="text-sm text-muted-foreground">Upload your event or company logo</p>
              </div>
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <motion.div 
              variants={uploadZoneVariants}
              initial="idle"
              whileHover={!logo ? "hover" : undefined}
              whileTap={!logo ? "tap" : undefined}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                logo ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={!logo ? handleLogoClick : undefined}
            >
              <AnimatePresence mode="wait">
                {isUploading === "logo" ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p className="text-foreground font-medium">Uploading logo...</p>
                  </motion.div>
                ) : logo ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-xl bg-gradient-card flex items-center justify-center overflow-hidden border border-border/50">
                      {logo.url ? (
                        <img src={logo.url} alt="Logo preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Image className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-foreground truncate max-w-[150px]">{logo.name}</p>
                      <p className="text-sm text-muted-foreground">{logo.size}</p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                        className="text-sm text-destructive hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    </motion.div>
                    <p className="text-foreground font-medium mb-1">Click to upload logo</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG or SVG (max 5MB)</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Colors */}
          <motion.div
            custom={0.1}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Palette className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Colors</h2>
                <p className="text-sm text-muted-foreground">Set your brand colors</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    ref={primaryColorRef}
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="sr-only"
                  />
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => handleColorClick(primaryColorRef)}
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-muted border-border/50 font-mono text-foreground uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-3">
                  <input
                    ref={secondaryColorRef}
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="sr-only"
                  />
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer shadow-lg"
                    style={{ backgroundColor: secondaryColor }}
                    onClick={() => handleColorClick(secondaryColorRef)}
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="bg-muted border-border/50 font-mono text-foreground uppercase"
                  />
                </div>
              </div>

              {/* Color Preview */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-xl border border-border/30 overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` 
                }}
              >
                <p className="text-xs text-muted-foreground mb-2">Live Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  <div 
                    className="flex-1 h-2 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Typography */}
          <motion.div
            custom={0.2}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Type className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Typography</h2>
                <p className="text-sm text-muted-foreground">Choose your fonts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Primary Font
                </label>
                <select 
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>

              <motion.div 
                key={fontFamily}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-xl bg-muted/50 border border-border/30"
              >
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily }}>
                  Award Winner Name
                </p>
                <p className="text-muted-foreground" style={{ fontFamily }}>
                  Category Name • 2024 Awards
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Music */}
          <motion.div
            custom={0.3}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Music className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Background Music</h2>
                <p className="text-sm text-muted-foreground">Add royalty-free music</p>
              </div>
            </div>

            <input
              ref={musicInputRef}
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={handleMusicUpload}
              className="hidden"
            />

            <motion.div 
              variants={uploadZoneVariants}
              initial="idle"
              whileHover={!musicTrack ? "hover" : undefined}
              whileTap={!musicTrack ? "tap" : undefined}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                musicTrack ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={!musicTrack ? handleMusicClick : undefined}
            >
              <AnimatePresence mode="wait">
                {isUploading === "music" ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p className="text-foreground font-medium">Uploading music...</p>
                  </motion.div>
                ) : musicTrack ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-primary-foreground" />
                        ) : (
                          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                        )}
                      </motion.button>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{musicTrack.name}</p>
                        <p className="text-sm text-muted-foreground">{musicTrack.size}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRemoveMusic(); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    </motion.div>
                    <p className="text-foreground font-medium mb-1">Click to upload music</p>
                    <p className="text-sm text-muted-foreground">MP3, WAV or M4A (max 10MB)</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-sm font-medium text-foreground mb-3">Royalty-Free Library</p>
              <div className="flex gap-2 flex-wrap">
                {["Celebration", "Corporate", "Dramatic", "Upbeat"].map((track) => (
                  <motion.div key={track} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={selectedLibraryTrack === track ? "hero" : "secondary"} 
                      size="sm"
                      onClick={() => handleSelectLibraryTrack(track)}
                      className="transition-all"
                    >
                      {selectedLibraryTrack === track && <Check className="h-3 w-3 mr-1" />}
                      {track}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
