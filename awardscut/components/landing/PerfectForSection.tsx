"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Building2, 
  Landmark, 
  GraduationCap, 
  Sparkles, 
  Heart, 
  Film 
} from "lucide-react";

const useCases = [
  {
    icon: Building2,
    title: "Corporate Awards Nights",
    description: "Sales kickoffs, employee recognition, annual galas",
  },
  {
    icon: Landmark,
    title: "Government & Industry",
    description: "Excellence awards, innovation prizes, sector recognition",
  },
  {
    icon: Film,
    title: "Gala Dinners",
    description: "Black-tie events, fundraisers, formal ceremonies",
  },
  {
    icon: Sparkles,
    title: "Creative & Media",
    description: "Film festivals, music awards, design competitions",
  },
  {
    icon: Heart,
    title: "Not-for-Profit & Community",
    description: "Volunteer recognition, community heroes, charity events",
  },
  {
    icon: GraduationCap,
    title: "Graduation & Prize-Giving",
    description: "Academic excellence, scholarships, sports awards",
  },
];

function UseCaseCard({ useCase, index }: { useCase: typeof useCases[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
        <useCase.icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {useCase.title}
        </h3>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {useCase.description}
        </p>
      </div>
    </motion.div>
  );
}

export function PerfectForSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section id="use-cases" className="py-24 bg-background">
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
            Perfect For
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Built for Every Celebration
          </h2>
          <p className="text-lg text-foreground/60">
            From intimate gatherings to large-scale galas—Awardscut scales with your event.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={useCase.title} useCase={useCase} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
