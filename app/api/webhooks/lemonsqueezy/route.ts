import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { LemonSqueezyWebhookPayload } from '@/types';

// Lazily create admin client to avoid build-time errors
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Verify the webhook signature from Lemon Squeezy
 */
function verifySignature(payload: string, signature: string | null): boolean {
    if (!signature) return false;

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
        return false;
    }

    const hash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Map Lemon Squeezy billing interval to our billing period
 */
function mapBillingPeriod(interval: string | undefined): 'month' | 'year' | null {
    if (interval === 'month') return 'month';
    if (interval === 'year') return 'year';
    return null;
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature');

        // Verify webhook signature
        if (!verifySignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody);
        const { meta, data } = payload;
        const eventName = meta.event_name;

        console.log(`Received Lemon Squeezy webhook: ${eventName}`);

        // Get user email from custom data or subscription attributes
        const userEmail = meta.custom_data?.user_email || data.attributes.user_email;

        if (!userEmail) {
            console.error('No user email found in webhook payload');
            return NextResponse.json({ error: 'No user email' }, { status: 400 });
        }

        // Look up user by email
        const { data: profile, error: profileError } = await getSupabaseAdmin()
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

        if (profileError || !profile) {
            console.error(`User not found for email: ${userEmail}`);
            // Return 200 to prevent retries - user might not have signed up yet
            return NextResponse.json({ received: true, warning: 'User not found' });
        }

        const userId = profile.id;
        const subscriptionId = data.id;
        const attrs = data.attributes;

        // Handle different event types
        switch (eventName) {
            case 'subscription_created':
            case 'subscription_updated':
            case 'subscription_resumed': {
                const subscriptionData = {
                    user_id: userId,
                    lemon_squeezy_id: subscriptionId,
                    order_id: attrs.order_id?.toString() || null,
                    product_id: attrs.product_id.toString(),
                    variant_id: attrs.variant_id.toString(),
                    variant_name: attrs.variant_name,
                    status: attrs.status,
                    renews_at: attrs.renews_at,
                    ends_at: attrs.ends_at,
                    trial_ends_at: attrs.trial_ends_at,
                    price_cents: attrs.first_subscription_item?.price || 0,
                    billing_period: mapBillingPeriod(attrs.variant_name?.toLowerCase().includes('annual') ? 'year' : 'month'),
                    updated_at: new Date().toISOString(),
                };

                // Upsert subscription (insert or update if exists)
                const { error: upsertError } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .upsert(subscriptionData, {
                        onConflict: 'user_id',
                    });

                if (upsertError) {
                    console.error('Error upserting subscription:', upsertError);
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }

                console.log(`Subscription ${eventName} for user ${userId}`);
                break;
            }

            case 'subscription_cancelled': {
                // Keep status as cancelled but don't remove - user keeps access until ends_at
                const { error: cancelError } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .update({
                        status: 'cancelled',
                        ends_at: attrs.ends_at,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('lemon_squeezy_id', subscriptionId);

                if (cancelError) {
                    console.error('Error cancelling subscription:', cancelError);
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }

                console.log(`Subscription cancelled for user ${userId}, ends at ${attrs.ends_at}`);
                break;
            }

            case 'subscription_expired': {
                // Subscription has fully expired
                const { error: expireError } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .update({
                        status: 'expired',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('lemon_squeezy_id', subscriptionId);

                if (expireError) {
                    console.error('Error expiring subscription:', expireError);
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }

                console.log(`Subscription expired for user ${userId}`);
                break;
            }

            case 'subscription_payment_failed': {
                // Mark as past due
                const { error: failError } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .update({
                        status: 'past_due',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('lemon_squeezy_id', subscriptionId);

                if (failError) {
                    console.error('Error updating payment failed:', failError);
                }

                console.log(`Payment failed for user ${userId}`);
                break;
            }

            case 'subscription_payment_success': {
                // Reactivate if it was past due
                const { error: successError } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('lemon_squeezy_id', subscriptionId);

                if (successError) {
                    console.error('Error updating payment success:', successError);
                }

                console.log(`Payment succeeded for user ${userId}`);
                break;
            }

            default:
                console.log(`Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Lemon Squeezy may send GET requests to verify the endpoint
export async function GET() {
    return NextResponse.json({ status: 'Webhook endpoint active' });
}
