// Template type definitions and data
export interface Template {
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

export const templates: Template[] = [
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

export const typeLabels = {
  corporate: "Corporate",
  modern: "Modern",
  luxury: "Luxury",
  minimal: "Minimal",
  event: "Event / Gala",
  social: "Social Media",
};

export const typeColors = {
  corporate: "bg-blue-500/20 text-blue-400",
  modern: "bg-zinc-500/20 text-zinc-400",
  luxury: "bg-amber-500/20 text-amber-400",
  minimal: "bg-gray-500/20 text-gray-400",
  event: "bg-red-500/20 text-red-400",
  social: "bg-purple-500/20 text-purple-400",
};
