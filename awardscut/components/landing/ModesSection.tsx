"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check, X, Zap, Crown, HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const easyFeatures = [
  "Auto templates",
  "Auto branding",
  "One-click generation",
  "Basic editing",
  "3 video formats",
];

const proFeatures = [
  "Everything in Easy",
  "Full template control",
  "Advanced editing",
  "Custom music library",
  "API sharing",
  "Custom branding per award",
];

const comparisonFeatures = [
  { name: "CSV Awards List Upload", easy: true, pro: true },
  { name: "Templates + Branding workflow", easy: true, pro: true },
  { name: "Livestream + Stream Health monitoring", easy: false, pro: true },
  { name: "Multi-admin team access", easy: false, pro: true },
  { name: "Advanced editing (trim/cut/crop + timeline)", easy: false, pro: true },
  { name: "Social formats (vertical/square/horizontal)", easy: true, pro: true },
  { name: "Direct sharing links + recipient delivery", easy: true, pro: true },
  { name: "Advanced analytics (days/months + ceremony deep dive)", easy: false, pro: true },
];

export function ModesSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [answers, setAnswers] = useState({
    awards: "",
    livestream: "",
    team: "",
  });
  const [recommendation, setRecommendation] = useState<"easy" | "pro" | null>(null);

  const handleGetRecommendation = () => {
    // Logic: Recommend Pro in most cases
    const isSmallEvent = answers.awards === "1-10";
    const noLivestream = answers.livestream === "no";
    const noTeam = answers.team === "no";

    if (isSmallEvent && noLivestream && noTeam) {
      setRecommendation("easy");
    } else {
      setRecommendation("pro");
    }
  };

  const resetModal = () => {
    setAnswers({ awards: "", livestream: "", team: "" });
    setRecommendation(null);
  };

  const allAnswered = answers.awards && answers.livestream && answers.team;

  return (
    <section id="modes" className="py-24 bg-background">
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
            Choose Your Mode
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Easy or Pro?
          </h2>
          <p className="text-lg text-foreground/60">
            Quick automation or full creative control—your choice.
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Easy Mode */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Easy Mode</h3>
                <p className="text-sm text-foreground/60">Quick & Automated</p>
              </div>
            </div>

            <p className="text-sm text-primary/80 font-medium mb-4">
              Best for first-time users and small events.
            </p>

            <p className="text-foreground/60 leading-relaxed mb-6">
              Perfect for first-time users. Professional results with minimal setup.
            </p>

            <ul className="space-y-3 mb-6 flex-grow">
              {easyFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-3">
              <Button variant="secondary" size="lg" className="w-full group-hover:bg-secondary/80 transition-colors" asChild>
                <Link href="/signup?mode=easy">
                  Try Easy (Limited)
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <p className="text-xs text-center text-foreground/50">
                Limited control – upgrade anytime.
              </p>
            </div>
          </motion.div>

          {/* Pro Mode */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group p-8 rounded-3xl bg-gradient-to-b from-primary/5 to-card border-2 border-primary/40 relative overflow-hidden hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col"
          >
            {/* Badges */}
            <div className="absolute top-0 right-0 flex gap-2 p-4">
              <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-md">
                MOST POPULAR
              </span>
              <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                RECOMMENDED
              </span>
            </div>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-50" />

            <div className="flex items-center gap-3 mb-2 mt-6 md:mt-0">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Pro Mode</h3>
                <p className="text-sm text-foreground/60">Full Creative Control</p>
              </div>
            </div>

            <p className="text-sm text-primary font-medium mb-4">
              Best for live award shows and teams who need full control.
            </p>

            <p className="text-foreground/60 leading-relaxed mb-6">
              For large events and teams who need complete control.
            </p>

            <ul className="space-y-3 mb-4 flex-grow">
              {proFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 text-xs text-foreground/60 mb-6 bg-primary/10 rounded-lg px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Most teams choose Pro for real ceremonies.</span>
            </div>

            <div className="mt-auto space-y-3">
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link href="/signup?mode=pro">
                  Start Pro (Recommended)
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <p className="text-xs text-center text-foreground/60">
                Upgrade for full control • built for real ceremonies
              </p>
            </div>
          </motion.div>
        </div>

        {/* Comparison Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-10"
        >
          <h3 className="text-xl font-bold text-foreground text-center mb-6">
            Feature Comparison
          </h3>
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border/50">
              <div className="p-4 text-sm font-semibold text-foreground">Feature</div>
              <div className="p-4 text-sm font-semibold text-foreground text-center border-l border-border/30">Easy</div>
              <div className="p-4 text-sm font-semibold text-primary text-center border-l border-border/30 bg-primary/5">Pro</div>
            </div>
            {/* Rows */}
            {comparisonFeatures.map((feature, idx) => (
              <div
                key={feature.name}
                className={`grid grid-cols-3 ${idx !== comparisonFeatures.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="p-4 text-sm text-foreground/80">{feature.name}</div>
                <div className="p-4 flex justify-center items-center border-l border-border/30">
                  {feature.easy ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <X className="h-5 w-5 text-foreground/30" />
                  )}
                </div>
                <div className="p-4 flex justify-center items-center border-l border-border/30 bg-primary/5">
                  {feature.pro ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <X className="h-5 w-5 text-foreground/30" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Need help choosing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => {
              resetModal();
              setHelpModalOpen(true);
            }}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            <HelpCircle className="h-4 w-4" />
            Need help choosing?
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>

      {/* Help Choosing Modal */}
      <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help Me Choose
            </DialogTitle>
            <DialogDescription className="text-foreground/60">
              Answer 3 quick questions and we'll recommend the best mode for you.
            </DialogDescription>
          </DialogHeader>

          {!recommendation ? (
            <div className="space-y-6 pt-4">
              {/* Question 1 */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">How many awards?</Label>
                <RadioGroup
                  value={answers.awards}
                  onValueChange={(val) => setAnswers({ ...answers, awards: val })}
                  className="flex flex-wrap gap-3"
                >
                  {["1-10", "10-100", "100+"].map((opt) => (
                    <div key={opt} className="flex items-center">
                      <RadioGroupItem value={opt} id={`awards-${opt}`} className="peer sr-only" />
                      <Label
                        htmlFor={`awards-${opt}`}
                        className="px-4 py-2 rounded-lg border border-border bg-background text-foreground/80 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:border-primary/50"
                      >
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Question 2 */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">Is your event livestreamed?</Label>
                <RadioGroup
                  value={answers.livestream}
                  onValueChange={(val) => setAnswers({ ...answers, livestream: val })}
                  className="flex gap-3"
                >
                  {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`livestream-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`livestream-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border bg-background text-foreground/80 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:border-primary/50"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Question 3 */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">Do you have a team?</Label>
                <RadioGroup
                  value={answers.team}
                  onValueChange={(val) => setAnswers({ ...answers, team: val })}
                  className="flex gap-3"
                >
                  {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`team-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`team-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border bg-background text-foreground/80 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:border-primary/50"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={handleGetRecommendation}
                disabled={!allAnswered}
                className="w-full"
                variant="hero"
              >
                Get My Recommendation
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="pt-4 text-center space-y-6">
              <div className={`p-6 rounded-2xl ${recommendation === 'pro' ? 'bg-primary/10 border-2 border-primary/30' : 'bg-secondary/50 border border-border'}`}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {recommendation === 'pro' ? (
                    <Crown className="h-8 w-8 text-primary" />
                  ) : (
                    <Zap className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  We recommend {recommendation === 'pro' ? 'Pro Mode' : 'Easy Mode'}
                </h3>
                <p className="text-foreground/60 text-sm">
                  {recommendation === 'pro' ? (
                    <>Based on your answers, Pro Mode will give you the livestream monitoring, team collaboration, and advanced analytics you need for a professional ceremony.</>
                  ) : (
                    <>For a small event without livestream or team, Easy Mode provides everything you need with a simpler interface. You can always upgrade later!</>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setHelpModalOpen(false)}
                  asChild
                >
                  <Link href={`/signup?mode=${recommendation}`}>
                    {recommendation === 'pro' ? 'Start Pro' : 'Try Easy'}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetModal}
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
