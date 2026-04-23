"use client";

import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Send } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const includedFeatures = [
  "Admin dashboard",
  "Awards upload",
  "Branding manager",
  "RTMP server access",
  "Auto highlight videos",
  "3 social formats",
  "Winner portal with OTP",
  "Email/SMS delivery",
];

export function PricingSection() {
  const [awardCount, setAwardCount] = useState(25);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    awardCount: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  const calculatePrice = (count: number): number => {
    if (count <= 10) {
      return count * 49.95;
    }
    return 10 * 49.95 + (count - 10) * 19.95;
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.awardCount) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    
    toast.success("Thank you! We'll get back to you within 24 hours.");
    setContactOpen(false);
    setContactForm({ name: "", email: "", company: "", awardCount: "", message: "" });
  };

  const totalPrice = calculatePrice(awardCount);

  return (
    <section id="pricing" className="py-24 bg-muted/30">
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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-foreground/60">
            Pay per award. No hidden fees. Winners never pay.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Pricing Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-card border border-border/50 shadow-lg mb-8"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">Pricing Calculator</h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calculator */}
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Number of Awards
                </label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={awardCount}
                  onChange={(e) => setAwardCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-lg h-12 bg-background border-border text-foreground [&::-webkit-inner-spin-button]:appearance-none"
                />
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={awardCount}
                  onChange={(e) => setAwardCount(parseInt(e.target.value))}
                  className="w-full mt-4 accent-primary cursor-pointer"
                />

                <div className="mt-6 p-4 rounded-xl bg-muted/50">
                  <div className="flex justify-between text-sm text-foreground/60 mb-2">
                    <span>1-10 awards</span>
                    <span className="font-medium">$49.95 each</span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground/60">
                    <span>10+ awards</span>
                    <span className="font-medium">$19.95 each</span>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="flex flex-col justify-center items-center text-center p-6 rounded-2xl bg-primary">
                <span className="text-sm font-medium text-primary-foreground/80 mb-2">
                  Your Total
                </span>
                <div className="text-5xl font-bold text-primary-foreground mb-2">
                  ${totalPrice.toFixed(2)}
                </div>
                <span className="text-sm text-primary-foreground/80 mb-6">
                  for {awardCount} awards
                </span>
                <Button variant="secondary" size="lg" className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Included Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-3xl bg-card border border-border/50"
          >
            <h4 className="text-lg font-semibold text-foreground mb-6">Everything Included</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/70">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bulk Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-8"
          >
            <p className="text-foreground/60">
              Need pricing for 100+ awards?{" "}
              <button
                onClick={() => setContactOpen(true)}
                className="text-primary hover:underline font-medium transition-colors"
              >
                Contact us for bulk pricing
              </button>
            </p>
          </motion.div>
        </div>

        {/* Contact Modal */}
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Bulk Pricing Inquiry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="contact-name" className="text-foreground">Name *</Label>
                <Input
                  id="contact-name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-foreground">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="you@company.com"
                  className="mt-1 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="contact-company" className="text-foreground">Company</Label>
                <Input
                  id="contact-company"
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  placeholder="Your company name"
                  className="mt-1 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="contact-awards" className="text-foreground">Number of Awards *</Label>
                <Input
                  id="contact-awards"
                  type="number"
                  value={contactForm.awardCount}
                  onChange={(e) => setContactForm({ ...contactForm, awardCount: e.target.value })}
                  placeholder="100+"
                  className="mt-1 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="contact-message" className="text-foreground">Message</Label>
                <Textarea
                  id="contact-message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us about your event..."
                  className="mt-1 bg-background border-border text-foreground min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleContactSubmit}
                disabled={isSubmitting}
                className="w-full"
                variant="hero"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
