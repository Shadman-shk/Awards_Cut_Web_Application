"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  plan: string | null;
  awardsRemaining: number;
  subscriptionStatus: string;
  isActive: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: null, awardsRemaining: 0, subscriptionStatus: "inactive", isActive: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("profiles")
      .select("plan, awards_remaining, subscription_status")
      .eq("id", user.id)
      .single();

    if (data) {
      setSubscription({
        plan: data.plan,
        awardsRemaining: data.awards_remaining || 0,
        subscriptionStatus: data.subscription_status || "inactive",
        isActive: data.subscription_status === "active",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const createCheckout = useCallback(async (planId: string, awardCount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, userId: user.id, email: user.email, awardCount }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.url) window.location.href = data.url;
  }, []);

  return { ...subscription, loading, createCheckout, refresh: fetchSubscription };
}
