"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormData } from "@/lib/validation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
const logoIcon = "/logo-icon.jpeg";

export default function Login() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Get redirect path from search params
  const from = searchParams?.get('from') || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(from);
    }
  }, [user, authLoading, router, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Clear auth error when user starts typing
  const emailValue = watch("email");
  const passwordValue = watch("password");

  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [emailValue, passwordValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    const { error } = await signIn(data.email, data.password, rememberMe);

    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return;
    }

    // Navigate will happen automatically via useEffect
    setIsLoading(false);
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

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">
            Log in to manage your awards ceremonies.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="you@company.com"
                  className={`pl-10 h-12 bg-charcoal-light border-border/50 text-foreground placeholder:text-muted-foreground ${
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
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-12 bg-charcoal-light border-border/50 text-foreground placeholder:text-muted-foreground ${
                    errors.password || authError ? "border-red-500/50 focus-visible:ring-red-500/20" : ""
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
              {/* Auth error - subtle red text below password field */}
              {authError && !errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2"
                >
                  {authError}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border accent-primary"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-card items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-primary/20 flex items-center justify-center">
            <img src={logoIcon} alt="Awardscut" className="h-20 w-20 rounded-xl" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Every Winner. Every Moment.
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            Transform your awards ceremonies with instant, branded video content delivered to winners in real-time.
          </p>
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
