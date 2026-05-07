import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import logoIcon from "@/assets/logo-icon.jpeg";
import { Link } from "react-router-dom";

interface TwoFactorChallengeProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorChallenge({ factorId, onSuccess, onCancel }: TwoFactorChallengeProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    if (code === "000000") {
      setError("Please enter a real code from your authenticator app.");
      setCode("");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (err: any) {
      console.error("2FA verify error:", err);
      setAttempts(prev => prev + 1);
      
      if (attempts >= 4) {
        setError("Too many failed attempts. Please wait and try again.");
      } else {
        setError("Invalid or expired code. Please try again.");
      }
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logoIcon} alt="Awardscut" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold text-foreground">Awardscut</span>
        </Link>

        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">Enter the code from your authenticator app</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2 mb-4"
            >
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              className="bg-muted border-border/50 text-center text-3xl tracking-[0.5em] font-mono h-14"
              autoFocus
              disabled={isVerifying || attempts >= 5}
            />

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleVerify}
              disabled={isVerifying || code.length !== 6 || attempts >= 5}
            >
              {isVerifying ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
              ) : (
                "Verify"
              )}
            </Button>

            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onCancel}>
              Use a different account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
