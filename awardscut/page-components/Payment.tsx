"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Lock, Check, Shield } from "lucide-react";
const logoIcon = "/logo-icon.jpeg";

export default function Payment() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [awardCount, setAwardCount] = useState(25);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const calculatePrice = (count: number): number => {
    if (count <= 10) {
      return count * 49.95;
    }
    return 10 * 49.95 + (count - 10) * 19.95;
  };

  const totalPrice = calculatePrice(awardCount);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Payment successful!",
      description: "Your subscription is now active. Redirecting to dashboard...",
    });

    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 mb-12">
          <img src={logoIcon} alt="Awardscut" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold text-foreground">Awardscut</span>
        </Link>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="p-6 rounded-2xl bg-card border border-border/50 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Awards Package</h3>
                <span className="px-3 py-1 rounded-full bg-gradient-gold text-charcoal text-xs font-bold">
                  PRO MODE
                </span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Number of Awards
                </label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={awardCount}
                  onChange={(e) => setAwardCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-12 bg-charcoal border-border/50"
                />
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={awardCount}
                  onChange={(e) => setAwardCount(parseInt(e.target.value))}
                  className="w-full mt-3 accent-primary"
                />
              </div>

              <div className="space-y-3 py-4 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.min(awardCount, 10)} awards × $49.95
                  </span>
                  <span className="text-foreground">
                    ${(Math.min(awardCount, 10) * 49.95).toFixed(2)}
                  </span>
                </div>
                {awardCount > 10 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {awardCount - 10} awards × $19.95
                    </span>
                    <span className="text-foreground">
                      ${((awardCount - 10) * 19.95).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-gradient-gold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-400 font-medium">
                  Your payment is secured with 256-bit SSL encryption
                </span>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Payment Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Cardholder Name
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  className="h-12 bg-charcoal-light border-border/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    maxLength={19}
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                    placeholder="4242 4242 4242 4242"
                    className="pl-10 h-12 bg-charcoal-light border-border/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Expiry Date
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    className="h-12 bg-charcoal-light border-border/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    CVC
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      maxLength={4}
                      value={formData.cvc}
                      onChange={(e) => setFormData({ ...formData, cvc: e.target.value.replace(/\D/g, "") })}
                      placeholder="123"
                      className="pl-10 h-12 bg-charcoal-light border-border/50"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Pay ${totalPrice.toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                By completing this purchase, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              </p>
            </form>

            {/* Payment methods */}
            <div className="mt-8 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground text-center mb-4">Accepted payment methods</p>
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <span className="text-sm font-medium">Visa</span>
                <span className="text-sm font-medium">Mastercard</span>
                <span className="text-sm font-medium">Amex</span>
                <span className="text-sm font-medium">Discover</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
