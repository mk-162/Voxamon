'use server';

import { createClient } from '@/lib/supabase/server';
import { getCheckoutUrl, getActiveSubscription, getCustomerPortalUrl } from '@/lib/subscriptions';
import { Subscription } from '@/types';

export interface CheckoutResult {
    success: boolean;
    checkoutUrl?: string;
    error?: string;
}

export interface SubscriptionResult {
    success: boolean;
    subscription?: Subscription | null;
    error?: string;
}

export interface PortalResult {
    success: boolean;
    portalUrl?: string;
    error?: string;
}

/**
 * Create a checkout session for a subscription
 */
export async function createCheckout(variantId: string): Promise<CheckoutResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to upgrade' };
        }

        if (!user.email) {
            return { success: false, error: 'Email required for checkout' };
        }

        const checkoutUrl = getCheckoutUrl({
            variantId,
            userEmail: user.email,
            userId: user.id,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account?upgraded=true`,
        });

        return { success: true, checkoutUrl };
    } catch (error) {
        console.error('Checkout error:', error);
        return { success: false, error: 'Failed to create checkout' };
    }
}

/**
 * Get the current user's subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        const subscription = await getActiveSubscription(user.id);
        return { success: true, subscription };
    } catch (error) {
        console.error('Get subscription error:', error);
        return { success: false, error: 'Failed to get subscription' };
    }
}

/**
 * Get the customer portal URL for managing billing
 */
export async function getPortalUrl(): Promise<PortalResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get customer ID from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('lemon_squeezy_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.lemon_squeezy_customer_id) {
            // No customer ID yet - they haven't subscribed
            return { success: false, error: 'No billing history' };
        }

        const portalUrl = getCustomerPortalUrl(profile.lemon_squeezy_customer_id);
        return { success: true, portalUrl };
    } catch (error) {
        console.error('Portal URL error:', error);
        return { success: false, error: 'Failed to get portal URL' };
    }
}
