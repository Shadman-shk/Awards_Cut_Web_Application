import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const PRICE_TO_TIER: Record<string, "free" | "starter" | "pro" | "enterprise"> = {
  starter_monthly: "starter",
  pro_monthly: "pro",
  enterprise_monthly: "enterprise",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const env: StripeEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";

  const webhookSecret = env === "live"
    ? Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET")
    : Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET");

  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const body = await req.text();
  const stripe = createStripeClient(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  console.log(`[payments-webhook] ${env} event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        if (userId && session.subscription) {
          const tier = PRICE_TO_TIER[priceId] || "starter";
          await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            tier,
            status: "active",
            provider_customer_id: session.customer,
            provider_subscription_id: session.subscription,
          }, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub: any = event.data.object;
        const userId = sub.metadata?.userId;
        const priceId = sub.metadata?.priceId || sub.items?.data?.[0]?.price?.lookup_key;
        if (userId) {
          const tier = PRICE_TO_TIER[priceId] || "starter";
          await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            tier,
            status: sub.status,
            provider_customer_id: sub.customer,
            provider_subscription_id: sub.id,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: !!sub.cancel_at_period_end,
          }, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub: any = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await supabase.from("user_subscriptions").update({
            tier: "free",
            status: "canceled",
            cancel_at_period_end: false,
          }).eq("user_id", userId);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice: any = event.data.object;
        if (invoice.subscription) {
          await supabase.from("user_subscriptions")
            .update({ status: "past_due" })
            .eq("provider_subscription_id", invoice.subscription);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
