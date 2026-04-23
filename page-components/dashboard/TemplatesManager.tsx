"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Check, 
  Play, 
  Crown, 
  Zap,
  Sparkles,
  Eye,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Palette,
  Type,
  Music,
  Image,
  Monitor,
  Smartphone,
  Square,
  Settings2,
  Loader2,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  RefreshCw,
  Star,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Template types
interface Template {
  id: string;
  name: string;
  type: "corporate" | "modern" | "luxury" | "minimal" | "event" | "social";
  description: string;
  animationStyle: string;
  textLayout: "center" | "left" | "right" | "bottom";
  logoPlacement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  colorTheme: string;
  fontStyle: string;
  gradient: string;
  previewGradient: string;
  features: string[];
  popular: boolean;
  proOnly: boolean;
  status: "active" | "draft" | "default";
}

const templates: Template[] = [
  {
    id: "1",
    name: "Corporate Excellence",
    type: "corporate",
    description: "Professional design for business events and corporate ceremonies",
    animationStyle: "Fade & Slide",
    textLayout: "center",
    logoPlacement: "top-right",
    colorTheme: "Blue & Silver",
    fontStyle: "Montserrat",
    gradient: "from-blue-900/50 to-slate-800/30",
    previewGradient: "from-blue-600 via-slate-500 to-blue-800",
    features: ["Professional layout", "Corporate branding", "Smooth transitions", "Business-friendly"],
    popular: true,
    proOnly: false,
    status: "default",
  },
  {
    id: "2",
    name: "Modern Edge",
    type: "modern",
    description: "Clean lines with bold typography and contemporary aesthetics",
    animationStyle: "Kinetic Text",
    textLayout: "left",
    logoPlacement: "bottom-right",
    colorTheme: "Charcoal & White",
    fontStyle: "Space Grotesk",
    gradient: "from-zinc-800/50 to-neutral-700/30",
    previewGradient: "from-zinc-600 via-neutral-500 to-zinc-800",
    features: ["Bold typography", "Minimalist design", "Dynamic motion", "Sharp edges"],
    popular: false,
    proOnly: false,
    status: "active",
  },
  {
    id: "3",
    name: "Luxury Gold",
    type: "luxury",
    description: "Elegant gold accents with premium visual treatment",
    animationStyle: "Particle Reveal",
    textLayout: "center",
    logoPlacement: "top-left",
    colorTheme: "Gold & Black",
    fontStyle: "Playfair Display",
    gradient: "from-amber-900/50 to-yellow-800/30",
    previewGradient: "from-amber-500 via-yellow-400 to-amber-600",
    features: ["Golden accents", "Particle effects", "Premium feel", "Elegant transitions"],
    popular: true,
    proOnly: true,
    status: "active",
  },
  {
    id: "4",
    name: "Pure Minimal",
    type: "minimal",
    description: "Ultra-clean design that lets the content speak",
    animationStyle: "Subtle Fade",
    textLayout: "bottom",
    logoPlacement: "top-left",
    colorTheme: "White & Gray",
    fontStyle: "Inter",
    gradient: "from-gray-200/50 to-white/30",
    previewGradient: "from-gray-100 via-white to-gray-200",
    features: ["Ultra-clean", "Content-focused", "Subtle motion", "Timeless design"],
    popular: false,
    proOnly: false,
    status: "active",
  },
  {
    id: "5",
    name: "Gala Night",
    type: "event",
    description: "Red carpet glamour for prestigious award ceremonies",
    animationStyle: "Spotlight Reveal",
    textLayout: "center",
    logoPlacement: "top-right",
    colorTheme: "Red & Gold",
    fontStyle: "Cinzel",
    gradient: "from-red-900/50 to-rose-800/30",
    previewGradient: "from-red-600 via-rose-500 to-red-800",
    features: ["Red carpet style", "Spotlight effects", "Glamorous feel", "Event-ready"],
    popular: true,
    proOnly: true,
    status: "active",
  },
  {
    id: "6",
    name: "Social Buzz",
    type: "social",
    description: "Optimized for social media sharing with engaging visuals",
    animationStyle: "Pop & Zoom",
    textLayout: "center",
    logoPlacement: "bottom-left",
    colorTheme: "Vibrant Multi",
    fontStyle: "Poppins",
    gradient: "from-purple-900/50 to-pink-800/30",
    previewGradient: "from-purple-500 via-pink-400 to-purple-600",
    features: ["Social optimized", "Attention-grabbing", "Shareable format", "Trending style"],
    popular: false,
    proOnly: false,
    status: "active",
  },
];

const typeLabels = {
  corporate: "Corporate",
  modern: "Modern",
  luxury: "Luxury",
  minimal: "Minimal",
  event: "Event / Gala",
  social: "Social Media",
};

const typeColors = {
  corporate: "bg-blue-500/20 text-blue-400",
  modern: "bg-zinc-500/20 text-zinc-400",
  luxury: "bg-amber-500/20 text-amber-400",
  minimal: "bg-gray-500/20 text-gray-400",
  event: "bg-red-500/20 text-red-400",
  social: "bg-purple-500/20 text-purple-400",
};

const aspectRatios = [
  { id: "landscape", label: "Landscape", ratio: "16:9", icon: Monitor },
  { id: "square", label: "Square", ratio: "1:1", icon: Square },
  { id: "vertical", label: "Vertical", ratio: "9:16", icon: Smartphone },
];

const fonts = [
  "Space Grotesk",
  "Montserrat",
  "Playfair Display",
  "Inter",
  "Poppins",
  "Cinzel",
  "Roboto",
  "Open Sans",
];

export default function TemplatesManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("1");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPro] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Customization state
  const [customization, setCustomization] = useState({
    logo: null as File | null,
    logoPreview: "",
    primaryColor: "#B5553A",
    secondaryColor: "#D4A574",
    fontFamily: "Space Grotesk",
    enableAnimations: true,
    enableMusic: true,
    aspectRatio: "landscape",
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle progress simulation
  useEffect(() => {
    if (isPlaying && previewTemplate) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 80);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, previewTemplate]);

  const handleSelect = (id: string, name: string) => {
    setSelectedTemplate(id);
    toast({
      title: `${name} selected!`,
      description: "Template will be applied to all your award videos.",
    });
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setIsPlaying(true);
    setProgress(0);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
    setIsPlaying(false);
    setProgress(0);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      handleSelect(previewTemplate.id, previewTemplate.name);
      handleClosePreview();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomization(prev => ({ ...prev, logo: file, logoPreview: url }));
      toast({
        title: "Logo uploaded",
        description: "Your logo will appear in the video preview.",
      });
    }
  };

  const handleSaveCustomization = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsCustomizing(false);
    toast({
      title: "Customization saved!",
      description: "Your branding settings have been applied.",
    });
  };

  const filteredTemplates = filterType 
    ? templates.filter(t => t.type === filterType)
    : templates;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: index * 0.05 }
    }),
    hover: { 
      y: -8, 
      transition: { duration: 0.2 } 
    }
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
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Template Manager
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-6 w-6 text-gold" />
              </motion.span>
            </h1>
            <p className="text-muted-foreground">Choose and customize video templates for your award clips.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="secondary" 
              onClick={() => setIsCustomizing(true)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Customize Branding
            </Button>
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 rounded-full bg-gradient-gold text-charcoal text-xs font-bold cursor-default"
            >
              PRO MODE
            </motion.span>
          </div>
        </motion.div>

        {/* Type Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <Button
            variant={filterType === null ? "hero" : "secondary"}
            size="sm"
            onClick={() => setFilterType(null)}
          >
            All Templates
          </Button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={filterType === key ? "hero" : "secondary"}
              size="sm"
              onClick={() => setFilterType(filterType === key ? null : key)}
            >
              {label}
            </Button>
          ))}
        </motion.div>

        {/* Selected Template Banner */}
        <AnimatePresence>
          {selectedTemplateData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Currently Active Template</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{selectedTemplateData.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[selectedTemplateData.type]}`}>
                      {typeLabels[selectedTemplateData.type]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(selectedTemplateData)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setIsCustomizing(true)}
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Customize
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aspect Ratio Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="p-4 rounded-xl bg-card border border-border/50"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Output Format</h3>
              <p className="text-sm text-muted-foreground">Select aspect ratio for your videos</p>
            </div>
            <div className="flex gap-2">
              {aspectRatios.map((ar) => (
                <motion.button
                  key={ar.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCustomization(prev => ({ ...prev, aspectRatio: ar.id }));
                    toast({ title: `${ar.label} format selected`, description: `Videos will be rendered in ${ar.ratio} aspect ratio.` });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    customization.aspectRatio === ar.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border/50 hover:border-border"
                  }`}
                >
                  <ar.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{ar.label}</span>
                  <span className="text-xs opacity-70">{ar.ratio}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Templates Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredTemplates.map((template, index) => {
            const isSelected = selectedTemplate === template.id;
            const isLocked = template.proOnly && !isPro;

            if (viewMode === "list") {
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative p-4 rounded-xl bg-card border-2 transition-all ${
                    isSelected
                      ? "border-primary shadow-[0_0_20px_-5px_rgba(181,85,58,0.3)]"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div 
                      className={`relative w-full sm:w-48 aspect-video rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center cursor-pointer overflow-hidden group flex-shrink-0`}
                      onClick={() => handlePreview(template)}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.2 }}
                        className="w-10 h-10 rounded-full bg-charcoal/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary transition-all"
                      >
                        <Play className="h-5 w-5 text-foreground ml-0.5" />
                      </motion.div>
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[template.type]}`}>
                              {typeLabels[template.type]}
                            </span>
                            {template.popular && (
                              <span className="px-2 py-0.5 rounded-full bg-gradient-gold text-charcoal text-xs font-bold flex items-center gap-1">
                                <Star className="h-3 w-3" /> Popular
                              </span>
                            )}
                            {template.status === "default" && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        {template.proOnly && (
                          <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 flex-shrink-0">
                            <Crown className="h-3 w-3" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {template.fontStyle}</span>
                        <span className="flex items-center gap-1"><Palette className="h-3 w-3" /> {template.colorTheme}</span>
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {template.animationStyle}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Button
                        variant={isSelected ? "hero" : "secondary"}
                        size="sm"
                        disabled={isLocked}
                        onClick={() => handleSelect(template.id, template.name)}
                        className="flex-1 sm:flex-initial"
                      >
                        {isSelected ? <><Check className="h-4 w-4" /> Active</> : isLocked ? "Unlock" : "Select"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={template.id}
                custom={index}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={cardVariants}
                className={`relative p-4 rounded-2xl bg-card border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary shadow-[0_0_30px_-5px_rgba(181,85,58,0.4)]"
                    : "border-border/50 hover:border-border"
                } ${isLocked ? "opacity-75" : ""}`}
                onClick={() => !isLocked && handleSelect(template.id, template.name)}
              >
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                  {template.popular && (
                    <span className="px-2 py-1 rounded-full bg-gradient-gold text-charcoal text-xs font-bold flex items-center gap-1">
                      <Star className="h-3 w-3" /> Popular
                    </span>
                  )}
                  {template.proOnly && (
                    <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                      <Crown className="h-3 w-3" /> PRO
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {template.status === "default" && (
                  <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium z-10">
                    Default
                  </div>
                )}

                {/* Preview Thumbnail */}
                <div 
                  className={`aspect-video rounded-xl bg-gradient-to-br ${template.gradient} mb-4 flex items-center justify-center relative overflow-hidden group`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-gold/5" />
                  
                  <div className="relative z-10 text-center">
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-charcoal/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 group-hover:bg-primary transition-all duration-300 shadow-lg"
                    >
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground font-medium">Preview</span>
                  </div>
                  
                  {/* Selected indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      >
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Type Badge */}
                <div className="mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[template.type]}`}>
                    {typeLabels[template.type]}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-foreground mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.features.slice(0, 3).map((feature, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 border-t border-border/30 pt-3">
                  <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {template.fontStyle}</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {template.animationStyle}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={isSelected ? "hero" : "secondary"}
                      className={`w-full transition-all ${isSelected ? "shadow-lg" : ""}`}
                      disabled={isLocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(template.id, template.name);
                      }}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-4 w-4" /> Selected
                        </span>
                      ) : (
                        <span>{isLocked ? "Unlock with Pro" : "Select Template"}</span>
                      )}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pro Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-2xl bg-gradient-card border border-primary/30"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0"
            >
              <Zap className="h-8 w-8 text-gold" />
            </motion.div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Unlock All Premium Templates
              </h3>
              <p className="text-muted-foreground">
                Get access to Luxury Gold, Gala Night, and more exclusive templates with advanced customization options.
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="gold">
                Upgrade to Pro
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => handleClosePreview()}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-charcoal border-border/50">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">
                {previewTemplate?.name}
              </span>
              {previewTemplate && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[previewTemplate.type]}`}>
                  {typeLabels[previewTemplate.type]}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="p-4 space-y-4">
              {/* Video Player */}
              <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${previewTemplate.previewGradient} ${
                customization.aspectRatio === "vertical" ? "aspect-[9/16] max-w-sm mx-auto" :
                customization.aspectRatio === "square" ? "aspect-square max-w-lg mx-auto" :
                "aspect-video"
              }`}>
                {/* Animated preview content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center text-white p-4"
                  >
                    {/* Logo */}
                    {customization.logoPreview && (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={customization.logoPreview}
                        alt="Logo"
                        className={`h-12 object-contain absolute ${
                          previewTemplate.logoPlacement === "top-left" ? "top-4 left-4" :
                          previewTemplate.logoPlacement === "top-right" ? "top-4 right-4" :
                          previewTemplate.logoPlacement === "bottom-left" ? "bottom-4 left-4" :
                          previewTemplate.logoPlacement === "bottom-right" ? "bottom-4 right-4" :
                          "top-4 left-1/2 -translate-x-1/2"
                        }`}
                      />
                    )}
                    
                    <motion.div
                      animate={{ 
                        scale: isPlaying ? [1, 1.05, 1] : 1,
                        opacity: isPlaying ? [1, 0.9, 1] : 1
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mb-4"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                        <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                        Sarah Johnson
                      </h2>
                      <p className="text-base sm:text-lg opacity-90 drop-shadow-md mb-2">
                        Best Innovation Award 2024
                      </p>
                      <p className="text-sm opacity-70">
                        Annual Tech Excellence Awards
                      </p>
                    </motion.div>

                    {/* Sample transitions indicator */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isPlaying ? 1 : 0 }}
                      className="absolute bottom-20 left-1/2 -translate-x-1/2"
                    >
                      <span className="text-xs text-white/70 bg-black/30 px-3 py-1 rounded-full">
                        {previewTemplate.animationStyle} transition
                      </span>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Play/Pause overlay */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!isPlaying) setProgress(0);
                    setIsPlaying(!isPlaying);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                >
                  <AnimatePresence mode="wait">
                    {!isPlaying && progress >= 100 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <RefreshCw className="h-6 w-6 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-white/30 rounded-full mb-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!isPlaying) setProgress(0);
                          setIsPlaying(!isPlaying);
                        }}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </button>
                      <span className="text-xs text-white/80">
                        {Math.floor(progress / 100 * 8)}s / 8s
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {aspectRatios.map((ar) => (
                        <button
                          key={ar.id}
                          onClick={() => setCustomization(prev => ({ ...prev, aspectRatio: ar.id }))}
                          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                            customization.aspectRatio === ar.id
                              ? "bg-white text-charcoal"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          <ar.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                  <h4 className="font-semibold text-foreground mb-3">Template Features</h4>
                  <div className="space-y-2">
                    {previewTemplate.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                  <h4 className="font-semibold text-foreground mb-3">Template Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Animation Style</span>
                      <span className="text-foreground">{previewTemplate.animationStyle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Text Layout</span>
                      <span className="text-foreground capitalize">{previewTemplate.textLayout}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Logo Placement</span>
                      <span className="text-foreground capitalize">{previewTemplate.logoPlacement.replace("-", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Font Style</span>
                      <span className="text-foreground">{previewTemplate.fontStyle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Color Theme</span>
                      <span className="text-foreground">{previewTemplate.colorTheme}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={handleClosePreview}>
                  Close Preview
                </Button>
                <Button variant="hero" onClick={handleUseTemplate}>
                  <Check className="h-4 w-4" />
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customization Modal */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Customize Branding
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Personalize your video templates with your brand identity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Logo Upload */}
            <div>
              <Label className="text-foreground mb-2 block">Brand Logo</Label>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {customization.logoPreview ? (
                  <div className="flex items-center justify-center gap-4">
                    <img src={customization.logoPreview} alt="Logo" className="h-16 object-contain" />
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setCustomization(prev => ({ ...prev, logo: null, logoPreview: "" }));
                    }}>
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload your logo</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-2 block">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="bg-muted border-border/50 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-foreground mb-2 block">Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customization.secondaryColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={customization.secondaryColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="bg-muted border-border/50 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Font */}
            <div>
              <Label className="text-foreground mb-2 block">Font Style</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="w-full justify-between">
                    <span style={{ fontFamily: customization.fontFamily }}>{customization.fontFamily}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-card border-border">
                  {fonts.map((font) => (
                    <DropdownMenuItem
                      key={font}
                      onClick={() => setCustomization(prev => ({ ...prev, fontFamily: font }))}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Enable Animations</span>
                </div>
                <button
                  onClick={() => setCustomization(prev => ({ ...prev, enableAnimations: !prev.enableAnimations }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    customization.enableAnimations ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    customization.enableAnimations ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </label>
              
              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Background Music</span>
                </div>
                <button
                  onClick={() => setCustomization(prev => ({ ...prev, enableMusic: !prev.enableMusic }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    customization.enableMusic ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    customization.enableMusic ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <h4 className="font-medium text-foreground mb-3">Live Preview</h4>
              <div 
                className="aspect-video rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${customization.primaryColor}40, ${customization.secondaryColor}40)` 
                }}
              >
                <div className="text-center" style={{ fontFamily: customization.fontFamily }}>
                  {customization.logoPreview && (
                    <img src={customization.logoPreview} alt="Logo" className="h-8 mx-auto mb-3 object-contain" />
                  )}
                  <p className="text-lg font-bold text-foreground">Winner Name</p>
                  <p className="text-sm text-muted-foreground">Award Title 2024</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSaveCustomization} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
