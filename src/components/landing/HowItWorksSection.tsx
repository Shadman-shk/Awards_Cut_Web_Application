import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Radio, Upload, Brain, Scissors, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Radio,
    title: "Connect your livestream",
    description: "Stream RTMP from any encoder (OBS, vMix, hardware) into AwardsCut.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload awards & branding",
    description: "Import your awards list and apply your logo, colours, and template.",
  },
  {
    number: "03",
    icon: Brain,
    title: "AI listens for winners",
    description: "AI listens for award announcements during the ceremony and surfaces suggestions.",
  },
  {
    number: "04",
    icon: Scissors,
    title: "Confirm or trigger",
    description: "Confirm AI suggestions or trigger manually — clips generate in seconds.",
  },
  {
    number: "05",
    icon: Send,
    title: "Deliver instantly",
    description: "Approved clips deliver to winners via email and SMS while still at the venue.",
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
      <div className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md">
          {step.number}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <step.icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{step.description}</p>
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
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How AwardsCut works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            From livestream to social-ready clip
          </h2>
          <p className="text-lg text-foreground/60">
            AI-assisted, operator-confirmed. You stay in control of every clip that reaches a winner.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
