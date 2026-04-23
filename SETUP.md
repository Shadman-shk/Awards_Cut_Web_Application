# AWARDSCUT — Drop-in Feature Installation Guide

## What's Included

This zip contains **3 features** as drop-in replacement files for your `awardscut/` project:

1. **Stripe Payment Integration** (real checkout, webhooks)
2. **Two-Factor Authentication** (TOTP via Supabase MFA)
3. **Fixed Livestream Hooks & Stores** (working mock pipeline)

---

## Installation Steps

### Step 1: Install Stripe package

```bash
cd awardscut
npm install stripe
```

### Step 2: Copy files into your project

Copy each file from this zip into the matching path in `awardscut/`:

```
DROP-IN FILE                                    → COPY TO (in awardscut/)
────────────────────────────────────────────────────────────────────────────
lib/stripe.ts                                   → lib/stripe.ts (NEW)
app/api/stripe/create-checkout/route.ts         → app/api/stripe/create-checkout/route.ts (NEW)
app/api/stripe/webhook/route.ts                 → app/api/stripe/webhook/route.ts (NEW)
hooks/useSubscription.ts                        → hooks/useSubscription.ts (NEW)
page-components/Payment.tsx                     → page-components/Payment.tsx (REPLACE)
components/auth/TwoFactorSetup.tsx              → components/auth/TwoFactorSetup.tsx (NEW)
components/auth/TwoFactorVerify.tsx             → components/auth/TwoFactorVerify.tsx (NEW)
app/verify-otp/page.tsx                         → app/verify-otp/page.tsx (NEW)
contexts/AuthContext.tsx                        → contexts/AuthContext.tsx (REPLACE)
hooks/useClipPipeline.ts                        → hooks/useClipPipeline.ts (REPLACE)
hooks/useLivepeerStream.ts                      → hooks/useLivepeerStream.ts (REPLACE)
hooks/useStreamRooms.ts                         → hooks/useStreamRooms.ts (REPLACE)
hooks/useDetectionSettings.ts                   → hooks/useDetectionSettings.ts (REPLACE)
hooks/useUserRole.ts                            → hooks/useUserRole.ts (REPLACE)
stores/livestreamStore.ts                       → stores/livestreamStore.ts (REPLACE)
lib/clipDownload.ts                             → lib/clipDownload.ts (REPLACE)
```

### Step 3: Set up environment variables

Copy `.env.example` to `.env.local` in your `awardscut/` folder and fill in:

```bash
cp .env.example awardscut/.env.local
```

### Step 4: Add Supabase columns for payments

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Add payment columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS awards_remaining INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
```

### Step 5: Enable MFA in Supabase

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Multi Factor Authentication"
3. Toggle **Enable MFA** to ON
4. Save

### Step 6: Set up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing: use `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Step 7: Run

```bash
cd awardscut
npm install
npm run dev
```

---

## How Each Feature Works

### Stripe Payments
- User goes to `/payment` → sees plan cards with real prices
- Clicks a plan → redirected to Stripe Checkout (hosted by Stripe)
- After payment → Stripe webhook fires → updates `profiles` table in Supabase
- `useSubscription()` hook checks payment status anywhere in the app

### Two-Factor Auth (2FA)
- User enables 2FA in Settings → `<TwoFactorSetup />` component
- Scans QR code with Google Authenticator / Authy
- Enters 6-digit code to verify enrollment
- On next login → after password, redirected to `/verify-otp`
- Enters 6-digit code → verified → enters dashboard
- AuthContext handles the MFA flow automatically

### Livestream (Fixed)
- All hooks now work with mock data (no API keys needed for testing)
- `useClipPipeline` → simulates AI detection of winner announcements, ovations, reactions
- `useStreamRooms` → manages up to 4 rooms with create/delete/rename
- `useLivepeerStream` → mock Livepeer stream creation (add real key for production)
- `useDetectionSettings` → sensitivity, layers, clip duration, auto-clip toggle
- `livestreamStore` → Zustand state for stream status, timer, mute

---

## Where to Use the 2FA Setup Component

Add this to your Settings page (`page-components/dashboard/Settings.tsx`):

```tsx
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

// Inside your Settings component, add:
<TwoFactorSetup onComplete={() => toast({ title: "2FA enabled!" })} />
```
