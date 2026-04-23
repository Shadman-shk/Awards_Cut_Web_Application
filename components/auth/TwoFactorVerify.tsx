"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

export function TwoFactorVerify() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    // Get the TOTP factor for the current user
    const getFactors = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error("Failed to list MFA factors:", error);
        return;
      }
      const totpFactor = data.totp.find((f) => f.status === "verified");
      if (totpFactor) {
        setFactorId(totpFactor.id);
      } else {
        // No MFA enrolled, redirect to dashboard
        router.push("/dashboard");
      }
    };
    getFactors();
  }, [router]);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast({ title: "Verified!", description: "Two-factor authentication successful." });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ title: "Invalid code", description: "Please check your authenticator app and try again.", variant: "destructive" });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-card border border-border/50"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Two-Factor Verification</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl tracking-[0.5em] font-mono h-14"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>

          <Button
            variant="default"
            className="w-full h-12"
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
            ) : (
              <><Shield className="h-5 w-5" /> Verify & Continue</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Lost access to your authenticator? Contact support for account recovery.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
