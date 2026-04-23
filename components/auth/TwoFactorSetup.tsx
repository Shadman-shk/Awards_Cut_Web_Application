"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, CheckCircle2, Smartphone, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"idle" | "enrolling" | "verify" | "done">("idle");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep("verify");
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast({ title: "Enter 6-digit code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setStep("done");
      toast({ title: "2FA enabled!", description: "Two-factor authentication is now active on your account." });
      onComplete?.();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied!", description: "Secret key copied to clipboard." });
  };

  if (step === "done") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">2FA Enabled</h3>
        <p className="text-sm text-muted-foreground">Your account is now protected with two-factor authentication.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
        </div>
      </div>

      {step === "idle" && (
        <div className="text-center py-4">
          <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-foreground font-medium mb-2">Protect your account</p>
          <p className="text-sm text-muted-foreground mb-6">Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.</p>
          <Button variant="default" onClick={handleEnroll} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</> : <><Shield className="h-4 w-4" /> Enable 2FA</>}
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-foreground font-medium mb-4">Scan this QR code with your authenticator app:</p>
            {qrCode && (
              <div className="inline-block p-4 bg-white rounded-xl mb-4">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Or enter this secret manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-foreground bg-muted p-2 rounded break-all">{secret}</code>
              <Button variant="ghost" size="icon" onClick={copySecret}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Save this secret somewhere safe. You'll need it if you lose your phone.
          </div>

          <div>
            <p className="text-sm text-foreground font-medium mb-2">Enter the 6-digit code from your app:</p>
            <div className="flex gap-2">
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
              />
              <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
