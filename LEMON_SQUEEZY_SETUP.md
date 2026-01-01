# Lemon Squeezy Setup Guide

## Overview

This guide covers setting up Lemon Squeezy payment integration for Vocalize Pro subscriptions.

**Pricing Structure:**
- Free: $0 (2-min recordings, 5 local history items)
- Pro Monthly: $9/month (30-min recordings, 100 cloud history)
- Pro Annual: $54/year (50% savings)

---

## Step 1: Create Lemon Squeezy Account

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com)
2. Sign up for an account
3. Complete business verification (required for payouts)

---

## Step 2: Create Your Store

1. Go to **Settings → Store**
2. Set your store name: `Vocalize` (or your preference)
3. Note your **store slug** (e.g., `vocalize`) - this appears in your checkout URLs

---

## Step 3: Create the Pro Product

1. Go to **Products → New Product**
2. Fill in:
   - **Name:** `Vocalize Pro`
   - **Description:** `Unlock 30-minute recordings, cloud history, and direct integrations`
   - **Pricing:** Select "Subscription"

---

## Step 4: Create Pricing Variants

Create two variants for your Pro product:

### Monthly Variant
1. Click **Add Variant**
2. Name: `Pro Monthly`
3. Price: `$9.00`
4. Billing interval: `Monthly`
5. Save and note the **Variant ID** (visible in URL or variant details)

### Annual Variant
1. Click **Add Variant**
2. Name: `Pro Annual`
3. Price: `$54.00`
4. Billing interval: `Yearly`
5. Save and note the **Variant ID**

### Finding Variant IDs

If you can't find variant IDs:
1. Go to **Products**
2. Click your product
3. Click on a variant
4. The ID is in the URL: `app.lemonsqueezy.com/products/XXX/variants/123456`
   - `123456` is your variant ID

---

## Step 5: Configure Webhook

1. Go to **Settings → Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **URL:** `https://your-domain.com/api/webhooks/lemonsqueezy`
   - **Signing secret:** Click generate - **copy this value**
   - **Events:** Select all subscription events:
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_resumed`
     - `subscription_expired`
     - `subscription_payment_failed`
     - `subscription_payment_success`
4. Save

---

## Step 6: Set Environment Variables

Add these to your `.env.local` (development) and production environment:

```bash
# Lemon Squeezy
NEXT_PUBLIC_LEMONSQUEEZY_STORE_SLUG=vocalize
NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_MONTHLY=123456
NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ANNUAL=123457
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

Replace:
- `vocalize` with your actual store slug
- `123456` / `123457` with your actual variant IDs
- Webhook secret with the one you copied

---

## Step 7: Run Database Migration

### Option A: Using Supabase CLI
```bash
npx supabase db push
```

### Option B: Using Supabase Dashboard
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/002_create_subscriptions.sql`
3. Run

---

## Step 8: Add Columns to Profiles Table

If not already present, run this SQL:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT;
```

---

## Step 9: Test the Integration

### Enable Test Mode (Recommended First)
1. In Lemon Squeezy, enable **Test Mode** (toggle in header)
2. Create test products/variants with same structure
3. Use test card: `4242 4242 4242 4242`

### Testing Flow
1. Start your app: `npm run dev`
2. Log in with a test user
3. Click "Upgrade" in header
4. Select a plan and click checkout
5. Complete with test card
6. Verify redirect to `/account?upgraded=true`
7. Check Supabase `subscriptions` table for new record

---

## Step 10: Test Webhooks Locally

For local development, use ngrok or similar:

```bash
# Install ngrok if needed
npm install -g ngrok

# Start tunnel
ngrok http 3000
```

Then temporarily update your Lemon Squeezy webhook URL to:
`https://your-ngrok-url.ngrok.io/api/webhooks/lemonsqueezy`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not received | Check URL is correct, HTTPS, publicly accessible |
| Invalid signature | Verify `LEMONSQUEEZY_WEBHOOK_SECRET` matches exactly |
| User not found | Ensure user email in Lemon Squeezy matches Supabase auth email |
| Checkout fails | Check variant IDs are correct and products are published |
| Build error about supabaseKey | Ensure all env vars are set in production |

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/002_create_subscriptions.sql` | Database schema |
| `lib/pricing.ts` | Plan definitions and pricing |
| `lib/subscriptions.ts` | Subscription utilities |
| `app/api/webhooks/lemonsqueezy/route.ts` | Webhook handler |
| `app/actions/subscriptions.ts` | Server actions |
| `app/account/page.tsx` | Account management page |
| `components/PricingModal.tsx` | Upgrade modal |

---

## Production Checklist

- [ ] Create Lemon Squeezy account and verify business
- [ ] Create store with correct slug
- [ ] Create Pro product with Monthly and Annual variants
- [ ] Configure webhook with correct production URL
- [ ] Set all environment variables in production
- [ ] Run database migration
- [ ] Add `is_pro` and `lemon_squeezy_customer_id` to profiles table
- [ ] Test checkout flow end-to-end
- [ ] Verify webhook receives events
- [ ] Test subscription cancellation flow
- [ ] Switch from Test Mode to Live Mode

---

## Support

- Lemon Squeezy Docs: https://docs.lemonsqueezy.com
- Lemon Squeezy API: https://docs.lemonsqueezy.com/api
- Webhook Events: https://docs.lemonsqueezy.com/help/webhooks
