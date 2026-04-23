"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Lock, Check, Shield, Loader2, Minus, Plus, Zap, Star, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
const logoIcon = "/logo-icon.jpeg";

const PLANS = [
  { id: "starter", name: "Starter", awards: 10, price: 49.95, icon: Zap, color: "primary", features: ["10 award clips", "AI detection", "Basic export"] },
  { id: "professional", name: "Professional", awards: 25, price: 39.95, icon: Star, color: "primary", popular: true, features: ["25 award clips", "AI detection", "HD export", "Priority support"] },
  { id: "enterprise", name: "Enterprise", awards: 100, price: 19.95, icon: Crown, color: "primary", features: ["100 award clips", "AI detection", "4K export", "Priority support", "Custom branding"] },
];

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createCheckout, isActive } = useSubscription();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [customCount, setCustomCount] = useState(25);

  const cancelled = searchParams.get("cancelled");

  const handleCheckout = async (planId: string, awardCount: number) => {
    setIsLoading(planId);
    try {
      await createCheckout(planId, awardCount);
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
      setIsLoading(null);
    }
  };

  if (isActive) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 rounded-2xl bg-card border border-border/50">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Subscription Active</h2>
          <p className="text-muted-foreground mb-6">Your plan is active. Head to dashboard to start.</p>
          <Button variant="default" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <img src={logoIcon} alt="Awardscut" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold text-foreground">Awardscut</span>
        </Link>

        {cancelled && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
            Payment was cancelled. Choose a plan below to try again.
          </motion.div>
        )}

        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-foreground mb-3">
            Choose Your Plan
          </motion.h1>
          <p className="text-muted-foreground text-lg">Pay per award. No subscriptions, no lock-in.</p>
        </div>

        {/* Plan Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl border ${plan.popular ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border/50 bg-card"}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  MOST POPULAR
                </span>
              )}
              <div className="text-center mb-6">
                <plan.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/award</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.awards} awards = ${(plan.price * plan.awards).toFixed(2)} total</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "default" : "secondary"}
                className="w-full"
                onClick={() => handleCheckout(plan.id, plan.awards)}
                disabled={isLoading !== null}
              >
                {isLoading === plan.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <>Get {plan.name}</>}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Custom amount */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-md mx-auto p-6 rounded-2xl bg-card border border-border/50 text-center">
          <h3 className="font-semibold text-foreground mb-3">Custom Amount</h3>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => setCustomCount(Math.max(1, customCount - 5))}><Minus className="h-4 w-4" /></Button>
            <span className="text-3xl font-bold text-foreground w-16 text-center">{customCount}</span>
            <Button variant="outline" size="icon" onClick={() => setCustomCount(Math.min(500, customCount + 5))}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {customCount} awards × ${customCount <= 10 ? "49.95" : customCount <= 25 ? "39.95" : "19.95"} = <span className="font-bold text-foreground">
              ${(customCount * (customCount <= 10 ? 49.95 : customCount <= 25 ? 39.95 : 19.95)).toFixed(2)} AUD
            </span>
          </p>
          <Button variant="default" className="w-full" onClick={() => handleCheckout("custom", customCount)} disabled={isLoading !== null}>
            {isLoading === "custom" ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><CreditCard className="h-4 w-4" /> Pay with Stripe</>}
          </Button>
        </motion.div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" /> Secured by Stripe · 256-bit encryption · PCI DSS Level 1
        </div>
      </div>
    </div>
  );
}
