import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MFAState {
  isEnabled: boolean;
  isLoading: boolean;
  factorId: string | null;
  refresh: () => Promise<void>;
  unenroll: () => Promise<{ error: Error | null }>;
}

export function useMFA(): MFAState {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsEnabled(false);
      setFactorId(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedTotp = data?.totp?.find(f => (f.status as string) === "verified");
      setIsEnabled(!!verifiedTotp);
      setFactorId(verifiedTotp?.id || null);
    } catch (err) {
      console.error("Error checking MFA status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unenroll = async (): Promise<{ error: Error | null }> => {
    if (!factorId) return { error: new Error("No MFA factor found") };

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      setIsEnabled(false);
      setFactorId(null);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { isEnabled, isLoading, factorId, refresh, unenroll };
}
