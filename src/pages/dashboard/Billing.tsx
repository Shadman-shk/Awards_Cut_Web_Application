import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const TIER_LABELS: Record<string, string> = {
  free: "Free", starter: "Starter", pro: "Pro", enterprise: "Enterprise",
};

export default function Billing() {
  const { user } = useAuth();
  const { subscription, tier, isPaid, loading, refetch } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "🎉 Subscription active", description: "Welcome aboard!" });
      // Realtime will pick up the webhook insert; trigger a manual refetch too
      setTimeout(() => void refetch(), 1500);
      searchParams.delete("checkout");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refetch]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/dashboard/billing`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(data?.error || error?.message || "Failed");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Couldn't open portal", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PaymentTestModeBanner />
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Plan</h1>
        <p className="text-muted-foreground mb-8">Manage your subscription, payment method, and invoices.</p>

        <Card className="p-6 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-foreground">{TIER_LABELS[tier]}</h2>
                    {isPaid && <Badge className="bg-primary/20 text-primary border-primary/30">{subscription?.status}</Badge>}
                    {tier === "free" && <Badge variant="outline">Free plan</Badge>}
                  </div>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.cancel_at_period_end ? "Cancels" : "Renews"} on{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {isPaid ? (
                  <Button onClick={openPortal} disabled={portalLoading} variant="outline">
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Manage in portal
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/pricing">
                      <Sparkles className="h-4 w-4" /> Upgrade
                    </Link>
                  </Button>
                )}
              </div>

              {!isPaid && (
                <div className="border-t border-border/50 pt-6">
                  <p className="text-sm text-foreground/70 mb-3">
                    You're on the Free plan. Upgrade to unlock unlimited events, AI moment detection, and remove watermarks.
                  </p>
                  <ul className="space-y-2 text-sm text-foreground/70">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited clips on Pro</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All social formats</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority email delivery</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-1">Need help?</h3>
          <p className="text-sm text-muted-foreground">
            Reach out at <a href="mailto:support@awardscut.com" className="text-primary hover:underline">support@awardscut.com</a> for billing questions.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
