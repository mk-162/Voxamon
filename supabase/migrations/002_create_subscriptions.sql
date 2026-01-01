-- Create subscriptions table for storing Lemon Squeezy subscription data
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lemon_squeezy_id TEXT UNIQUE NOT NULL,
    order_id TEXT,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'paused', 'on_trial')),
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    price_cents INTEGER NOT NULL,
    billing_period TEXT CHECK (billing_period IN ('month', 'year')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_squeezy ON subscriptions(lemon_squeezy_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only service role can insert/update subscriptions (via webhook)
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- Function to sync is_pro status to profiles table
CREATE OR REPLACE FUNCTION sync_pro_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles.is_pro based on active subscription
    UPDATE profiles
    SET is_pro = (NEW.status = 'active')
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync is_pro on subscription changes
DROP TRIGGER IF EXISTS sync_pro_on_subscription_change ON subscriptions;
CREATE TRIGGER sync_pro_on_subscription_change
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_pro_status();

-- Also handle subscription deletion (rare, but should reset is_pro)
CREATE OR REPLACE FUNCTION handle_subscription_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET is_pro = false
    WHERE id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reset_pro_on_subscription_delete ON subscriptions;
CREATE TRIGGER reset_pro_on_subscription_delete
    AFTER DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_delete();

-- Extend profiles table with additional fields for subscription tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT;

-- Create index on profiles email for webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
