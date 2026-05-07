import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "forever",
    priceId: null as string | null,
    features: [
      "1 event",
      "5 clips/month",
      "Basic templates",
      "Watermark on clips",
    ],
    cta: "Current plan",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    interval: "/month",
    priceId: "starter_monthly",
    features: [
      "3 events",
      "50 clips/month",
      "All templates",
      "Email delivery",
      "No watermark",
    ],
    cta: "Start Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    interval: "/month",
    priceId: "pro_monthly",
    popular: true,
    features: [
      "Unlimited events",
      "Unlimited clips",
      "AI moment detection",
      "All clip formats (16:9, 1:1, 9:16)",
      "Priority delivery",
      "Custom branding",
    ],
    cta: "Start Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$499",
    interval: "/month",
    priceId: "enterprise_monthly",
    features: [
      "Everything in Pro",
      "Team seats",
      "White-label",
      "SLA & dedicated support",
      "API access",
    ],
    cta: "Start Enterprise",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const handleSelect = (priceId: string | null) => {
    if (!priceId) return;
    if (!user) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }
    setCheckoutPriceId(priceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />

      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, scalable pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when you need more events, clips, or branding control.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 relative flex flex-col ${
                plan.popular ? "border-primary border-2 shadow-xl" : "border-border/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.interval}</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelect(plan.priceId)}
                disabled={!plan.priceId}
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!checkoutPriceId} onOpenChange={(o) => !o && setCheckoutPriceId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete your subscription</DialogTitle>
          </DialogHeader>
          {checkoutPriceId && user && (
            <StripeEmbeddedCheckout
              priceId={checkoutPriceId}
              customerEmail={user.email}
              userId={user.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
