import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import logoIcon from "@/assets/logo-icon.jpeg";

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  // Supabase reset link contains an access_token in the URL hash; the
  // client picks it up automatically and emits a PASSWORD_RECOVERY event.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true);
    });
    // Also check for an existing recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      else setTimeout(() => setValidSession((v) => v ?? false), 1500);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormData>();

  const onSubmit = async (data: ResetFormData) => {
    if (data.password !== data.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (data.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsLoading(false);

    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }

    setIsDone(true);
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logoIcon} alt="Awardscut" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold text-foreground">Awardscut</span>
        </Link>

        {isDone ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Password updated</h1>
            <p className="text-muted-foreground mb-8">Redirecting you to login…</p>
          </div>
        ) : validSession === false ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-3">Invalid or expired link</h1>
            <p className="text-muted-foreground mb-6">
              This reset link is no longer valid. Request a new one to continue.
            </p>
            <Button asChild variant="hero">
              <Link to="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : validSession === null ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <>
            <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>

            <h1 className="text-3xl font-bold text-foreground mb-2">Set a new password</h1>
            <p className="text-muted-foreground mb-8">Choose a strong password (8+ characters).</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 chars" } })}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 bg-charcoal-light border-border/50 text-foreground"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-2">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword", { required: "Please confirm" })}
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-charcoal-light border-border/50 text-foreground"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-2">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Updating…</> : "Update password"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
