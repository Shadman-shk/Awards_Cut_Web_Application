"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaRequired: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null; mfaRequired?: boolean }>;
  signUp: (email: string, password: string, metadata?: { name?: string; company?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  checkMfaStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email);
  const now = Date.now();
  if (!attempts) return { allowed: true };
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return { allowed: true };
  }
  if (attempts.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingTime: LOCKOUT_DURATION - (now - attempts.lastAttempt) };
  }
  return { allowed: true };
}

function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email);
  const now = Date.now();
  loginAttempts.set(email, {
    count: (attempts?.count || 0) + 1,
    lastAttempt: now,
  });
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const router = useRouter();

  // Check if user has MFA enrolled and needs verification
  const checkMfaStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return false;

      const verifiedFactors = data.totp.filter((f) => f.status === "verified");
      if (verifiedFactors.length === 0) return false;

      // Check current assurance level
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
        // User has MFA but hasn't completed second factor yet
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // After sign in, check if MFA verification is needed
        if (event === "SIGNED_IN" && session?.user) {
          const needsMfa = await checkMfaStatus();
          if (needsMfa) {
            setMfaRequired(true);
            router.push("/verify-otp");
          }
        }

        if (event === "SIGNED_OUT") {
          setMfaRequired(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkMfaStatus, router]);

  const signIn = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<{ error: AuthError | null; mfaRequired?: boolean }> => {
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      const mins = Math.ceil((rateCheck.remainingTime || 0) / 60000);
      return {
        error: {
          message: `Too many failed attempts. Try again in ${mins} minutes.`,
          status: 429,
          name: "AuthApiError",
        } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      recordFailedAttempt(email);
      return { error };
    }

    clearAttempts(email);

    // Check if MFA is needed
    if (data.session) {
      const needsMfa = await checkMfaStatus();
      if (needsMfa) {
        setMfaRequired(true);
        return { error: null, mfaRequired: true };
      }
    }

    return { error: null, mfaRequired: false };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { name?: string; company?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMfaRequired(false);
    router.push("/login");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, mfaRequired, signIn, signUp, signOut, resetPassword, checkMfaStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
