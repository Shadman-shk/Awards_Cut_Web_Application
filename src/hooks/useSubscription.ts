import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "active" | "trialing" | "past_due" | "canceled"
  | "incomplete" | "incomplete_expired" | "unpaid";

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, { events: number; clipsPerMonth: number; watermark: boolean }> = {
  free:       { events: 1,        clipsPerMonth: 5,    watermark: true  },
  starter:    { events: 3,        clipsPerMonth: 50,   watermark: false },
  pro:        { events: 999,      clipsPerMonth: 999,  watermark: false },
  enterprise: { events: Infinity, clipsPerMonth: Infinity, watermark: false },
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = useCallback(async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription((data as unknown as UserSubscription) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchSub();
    if (!user) return;

    const channel = supabase
      .channel("user-subscription")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "user_subscriptions", filter: `user_id=eq.${user.id}` },
        () => { void fetchSub(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSub]);

  const tier: SubscriptionTier = subscription?.tier || "free";
  const limits = TIER_LIMITS[tier];
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const isPaid = isActive && tier !== "free";

  return {
    subscription,
    loading,
    tier,
    limits,
    isActive,
    isPaid,
    hasWatermark: limits.watermark,
    refetch: fetchSub,
  };
}
