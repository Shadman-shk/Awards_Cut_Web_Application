"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { signupSchema, SignupFormData } from "@/lib/validation";
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, Check, Loader2 } from "lucide-react";
const logoIcon = "/logo-icon.jpeg";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode") || "pro";
  const { signUp, user, loading: authLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    if (!agreedToTerms) {
      setTermsError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    setTermsError(null);
    setIsLoading(true);

    const { error } = await signUp(data.email, data.password, {
      name: data.name,
      company: data.company,
    });

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Account created!",
      description: "Welcome to Awardscut. Redirecting to payment...",
    });

    setIsLoading(false);
    router.push("/payment");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <img src={logoIcon} alt="Awardscut" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-foreground">Awardscut</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              mode === "pro" 
                ? "bg-gradient-gold text-charcoal" 
                : "bg-secondary text-secondary-foreground"
            }`}>
              {mode.toUpperCase()} MODE
            </span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">
            Start creating instant video highlights for your winners.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  {...register("name")}
                  placeholder="John Smith"
                  className={`pl-10 h-12 bg-charcoal-light border-border/50 ${
                    errors.name ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-2">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="you@company.com"
                  className={`pl-10 h-12 bg-charcoal-light border-border/50 ${
                    errors.email ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Company / Organization
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  {...register("company")}
                  placeholder="Acme Awards Inc."
                  className={`pl-10 h-12 bg-charcoal-light border-border/50 ${
                    errors.company ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.company && (
                <p className="text-red-400 text-sm mt-2">{errors.company.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-12 bg-charcoal-light border-border/50 ${
                    errors.password ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className={`pl-10 h-12 bg-charcoal-light border-border/50 ${
                    errors.confirmPassword ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-2">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked) setTermsError(null);
                  }}
                  className="mt-1 rounded border-border accent-primary"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </div>
              {termsError && (
                <p className="text-red-400 text-sm mt-2">{termsError}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-card items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">
            What you'll get with Awardscut
          </h2>
          <ul className="space-y-4">
            {[
              "Real-time video editing automation",
              "Professional branded templates",
              "3 social media formats per award",
              "Secure OTP winner portals",
              "Automatic email & SMS delivery",
              "Full analytics dashboard",
              "24/7 priority support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
