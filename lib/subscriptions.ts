import { Subscription } from '@/types';
import { createClient } from './supabase/client';

const STORE_SLUG = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_SLUG || 'vocalize';

export interface CheckoutParams {
    variantId: string;
    userEmail: string;
    userId: string;
    redirectUrl?: string;
}

/**
 * Generate a Lemon Squeezy checkout URL
 */
export function getCheckoutUrl(params: CheckoutParams): string {
    const { variantId, userEmail, userId, redirectUrl } = params;

    const checkoutData = {
        email: userEmail,
        custom: {
            user_id: userId,
            user_email: userEmail,
        },
    };

    const queryParams = new URLSearchParams({
        'checkout[email]': userEmail,
        'checkout[custom][user_id]': userId,
        'checkout[custom][user_email]': userEmail,
    });

    if (redirectUrl) {
        queryParams.set('checkout[success_url]', redirectUrl);
    }

    return `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantId}?${queryParams.toString()}`;
}

/**
 * Generate a Lemon Squeezy customer portal URL
 */
export function getCustomerPortalUrl(customerId: string): string {
    return `https://${STORE_SLUG}.lemonsqueezy.com/billing`;
}

/**
 * Get the active subscription for a user
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        user_id: data.user_id,
        lemon_squeezy_id: data.lemon_squeezy_id,
        order_id: data.order_id,
        product_id: data.product_id,
        variant_id: data.variant_id,
        variant_name: data.variant_name,
        status: data.status,
        renews_at: data.renews_at,
        ends_at: data.ends_at,
        trial_ends_at: data.trial_ends_at,
        price_cents: data.price_cents,
        billing_period: data.billing_period,
        created_at: data.created_at,
        updated_at: data.updated_at,
    };
}

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;

    // Active status
    if (subscription.status === 'active') return true;

    // On trial
    if (subscription.status === 'on_trial') return true;

    // Cancelled but not yet expired (grace period)
    if (subscription.status === 'cancelled' && subscription.ends_at) {
        const endsAt = new Date(subscription.ends_at);
        return endsAt > new Date();
    }

    return false;
}

/**
 * Get subscription status display text
 */
export function getSubscriptionStatusText(subscription: Subscription): string {
    switch (subscription.status) {
        case 'active':
            return 'Active';
        case 'past_due':
            return 'Past Due';
        case 'cancelled':
            if (subscription.ends_at && new Date(subscription.ends_at) > new Date()) {
                return 'Cancelling';
            }
            return 'Cancelled';
        case 'expired':
            return 'Expired';
        case 'paused':
            return 'Paused';
        case 'on_trial':
            return 'Trial';
        default:
            return subscription.status;
    }
}

/**
 * Format a date for display
 */
export function formatSubscriptionDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
