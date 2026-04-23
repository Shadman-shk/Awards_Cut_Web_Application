"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  CalendarDays, 
  Upload, 
  Palette, 
  Radio, 
  Sparkles, 
  Scissors, 
  Send, 
  Share2 
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: CalendarDays,
    title: "Schedule Event",
    description: "Schedule your awards ceremony date and details.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload Awards",
    description: "Upload your awards list with categories and nominees.",
  },
  {
    number: "03",
    icon: Palette,
    title: "Choose Template",
    description: "Choose template and upload your brand assets.",
  },
  {
    number: "04",
    icon: Radio,
    title: "Stream to Awardscut",
    description: "Connect your livestream via RTMP server.",
  },
  {
    number: "05",
    icon: Sparkles,
    title: "Auto-Detect",
    description: "AI detects each category and winner announcement.",
  },
  {
    number: "06",
    icon: Scissors,
    title: "Instant Edit",
    description: "Highlight videos edited in real-time with your branding.",
  },
  {
    number: "07",
    icon: Send,
    title: "Deliver 3 Formats",
    description: "Vertical, Square, and Landscape clips delivered within minutes.",
  },
  {
    number: "08",
    icon: Share2,
    title: "Ready to Post",
    description: "Winners can share during the event while still at the venue.",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative"
    >
      {/* Connector line */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
      )}
      
      <div className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Step number */}
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md">
          {step.number}
        </div>
        
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <step.icon className="h-6 w-6 text-primary" />
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section id="how-it-works" className="py-24 bg-background">
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
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-foreground/60">
            From livestream to social-ready content in 8 automated steps.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
