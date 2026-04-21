"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validation";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
const logoIcon = "/logo-icon.jpeg";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    await resetPassword(data.email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-8">
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

        {isSubmitted ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-8">
              If an account with that email exists, we've sent you a link to reset your password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <h1 className="text-3xl font-bold text-foreground mb-2">Reset your password</h1>
            <p className="text-muted-foreground mb-8">
              Enter your email address and we'll send you a link to reset your password.
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
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
