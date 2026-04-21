"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Zap, 
  Smartphone, 
  Settings2, 
  Users, 
  Palette, 
  Clock,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Real-Time Editing",
    description: "Branded clips ready within minutes of each announcement.",
    benefit: "→ No post-event delays",
  },
  {
    icon: Smartphone,
    title: "Auto-Social Formatting",
    description: "Vertical, square, and landscape—optimized for TikTok, Instagram, LinkedIn, and more.",
    benefit: "→ Perfect for every platform",
  },
  {
    icon: Settings2,
    title: "No Extra Gear or Crew",
    description: "Works with your existing AV and livestream setup.",
    benefit: "→ Zero additional equipment costs",
  },
  {
    icon: Users,
    title: "Scalable & Automated",
    description: "Handles 5 to 5,000 winners with consistent quality.",
    benefit: "→ Enterprise-ready capacity",
  },
  {
    icon: Palette,
    title: "Brand Visibility",
    description: "Your logo, colors, fonts, and royalty-free music in every clip.",
    benefit: "→ 100% on-brand content",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Winners receive videos via email or SMS automatically.",
    benefit: "→ Share while still at the venue",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
        <feature.icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-foreground/60 leading-relaxed mb-3">
        {feature.description}
      </p>
      <p className="text-sm font-medium text-primary">
        {feature.benefit}
      </p>
    </motion.div>
  );
}

export function FeaturesSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features → Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-foreground/60">
            Powerful automation tools for unforgettable award ceremonies.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
