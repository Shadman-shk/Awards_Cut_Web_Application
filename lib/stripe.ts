import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    awards: 10,
    pricePerAward: 49.95,
  },
  professional: {
    name: "Professional",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    awards: 25,
    pricePerAward: 39.95,
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    awards: 100,
    pricePerAward: 19.95,
  },
} as const;

export type PlanId = keyof typeof PLANS;
