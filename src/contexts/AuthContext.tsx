import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { name?: string; company?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting: track failed login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email);
  const now = Date.now();

  if (!attempts) {
    return { allowed: true };
  }

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return { allowed: true };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const remainingTime = LOCKOUT_DURATION - (now - attempts.lastAttempt);
    return { allowed: false, remainingTime };
  }

  return { allowed: true };
}

function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email);
  const now = Date.now();

  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now });
  }
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    // Check rate limiting
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.remainingTime || 0) / 60000);
      return {
        error: {
          message: `Too many failed attempts. Please try again in ${minutes} minute(s).`,
          status: 429,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      recordFailedAttempt(email);
      // Generic error message for security - don't reveal if email exists
      return {
        error: {
          ...error,
          message: "Invalid email or password",
        } as AuthError,
      };
    }

    // Clear attempts on successful login
    clearAttempts(email);

    // Handle remember me by updating session persistence
    if (!rememberMe) {
      // Session will naturally expire based on Supabase settings
      // For shorter sessions without "remember me", we don't do anything special
      // as the default session is already time-limited
    }

    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { name?: string; company?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    // Always return success to prevent email enumeration
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
