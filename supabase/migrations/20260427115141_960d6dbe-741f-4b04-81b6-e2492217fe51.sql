
-- Subscription tier enum
DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE policies — only service role (webhook) can mutate.

-- Updated-at trigger
CREATE TRIGGER set_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_customer ON public.user_subscriptions(provider_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription ON public.user_subscriptions(provider_subscription_id);
