"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Play, Download, Share2, Trophy, Lock } from "lucide-react";
const logoIcon = "/logo-icon.jpeg";

export default function WinnerPortal() {
  const [step, setStep] = useState<"otp" | "verify" | "video">("otp");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "OTP Sent!", description: "Check your email for the verification code." });
    setIsLoading(false);
    setStep("verify");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "Verified!", description: "Welcome to your winner portal." });
    setIsLoading(false);
    setStep("video");
  };

  const handleDownload = () => toast({ title: "Download started!", description: "Your video will download shortly." });
  const handleShare = (platform: string) => toast({ title: `Sharing to ${platform}`, description: "Opening share dialog..." });

  if (step === "video") {
    return (
      <div className="min-h-screen bg-charcoal">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <img src={logoIcon} alt="Awardscut" className="h-12 w-12 rounded-lg mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Congratulations! 🎉</h1>
            <p className="text-muted-foreground">Your award-winning moment is ready to share.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
            <div className="aspect-video bg-charcoal-light flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="h-10 w-10 text-primary ml-1" />
                </div>
                <p className="text-lg font-bold text-foreground">Best Innovation Award</p>
                <p className="text-muted-foreground">Tech Excellence Awards 2024</p>
              </div>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Button variant="hero" size="lg" onClick={handleDownload}><Download className="h-5 w-5" />Download</Button>
            <Button variant="secondary" size="lg" onClick={() => handleShare("LinkedIn")}><Share2 className="h-5 w-5" />Share</Button>
            <Button variant="gold" size="lg" onClick={() => handleShare("Twitter")}>Post to X</Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Videos available in 3 formats: Landscape (16:9), Square (1:1), Vertical (9:16)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 rounded-2xl bg-card border border-border/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Winner Portal</h1>
          <p className="text-muted-foreground">{step === "otp" ? "Enter your email to access your video" : "Enter the verification code"}</p>
        </div>

        {step === "otp" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="h-12 bg-muted border-border/50" />
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : <><Lock className="h-5 w-5" />Send Verification Code</>}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <Input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" className="h-12 bg-muted border-border/50 text-center text-2xl tracking-widest" />
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access My Video"}
            </Button>
            <button type="button" onClick={() => setStep("otp")} className="w-full text-sm text-muted-foreground hover:text-foreground">Use different email</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
