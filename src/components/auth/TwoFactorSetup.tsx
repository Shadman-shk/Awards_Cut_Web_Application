import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"loading" | "scan" | "verify">("loading");
  const [factorId, setFactorId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    setStep("loading");
    setError(null);

    try {
      // First, check if there's already an enrolled TOTP factor
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      
      if (listError) throw listError;

      // If already has a verified TOTP factor, inform user
      const verifiedTotp = factors?.totp?.find(f => (f.status as string) === "verified");
      if (verifiedTotp) {
        toast({
          title: "2FA already enabled",
          description: "Two-factor authentication is already active on your account.",
        });
        onComplete();
        return;
      }

      // Unenroll ALL unverified factors first (any factorType, any name) to avoid conflicts
      const allFactors = [
        ...(factors?.totp || []),
        ...((factors as any)?.phone || []),
        ...((factors as any)?.all || []),
      ];
      const seen = new Set<string>();
      for (const f of allFactors) {
        if (!f?.id || seen.has(f.id)) continue;
        seen.add(f.id);
        if ((f.status as string) !== "verified") {
          try {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          } catch (e) {
            console.warn("Failed to unenroll stale factor", f.id, e);
          }
        }
      }

      // Enroll a new TOTP factor with a unique friendly name to avoid name conflicts
      const uniqueName = `Awardscut Authenticator ${new Date().toISOString().slice(0, 19)}`;
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: uniqueName,
      });

      if (enrollError) throw enrollError;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep("scan");
      }
    } catch (err: any) {
      console.error("MFA enrollment error:", err);
      setError(err.message || "Failed to set up 2FA. Please try again.");
      setStep("scan");
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    if (verificationCode === "000000") {
      toast({
        title: "Invalid code",
        description: "Please enter a real code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Create a challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify with the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA Enabled!",
        description: "Two-factor authentication is now active. You'll need your authenticator app to sign in.",
      });
      onComplete();
    } catch (err: any) {
      console.error("MFA verification error:", err);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("expired") || msg.includes("invalid")) {
        setError("Invalid or expired code. Please enter a new code from your authenticator app.");
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Secret key copied to clipboard." });
  };

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Setting up two-factor authentication...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {qrCode && (
        <>
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-white rounded-xl p-3">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          </div>

          {/* Manual key */}
          <div>
            <Label className="text-muted-foreground text-xs">Can't scan? Enter this key manually:</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border/50 text-xs font-mono text-foreground break-all">
                {secret}
              </code>
              <Button variant="ghost" size="sm" onClick={copySecret} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Verification input */}
          <div>
            <Label className="text-muted-foreground">Enter the 6-digit code from your app</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="bg-muted border-border/50 mt-1 text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
            />
          </div>
        </>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="hero"
          onClick={handleVerify}
          disabled={isVerifying || verificationCode.length !== 6 || !factorId}
        >
          {isVerifying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
          ) : (
            <><ShieldCheck className="h-4 w-4" /> Enable 2FA</>
          )}
        </Button>
      </div>
    </div>
  );
}
