export type DocType =
    | 'SUMMARY'
    | 'EMAIL_DRAFT'
    | 'MEETING_NOTES'
    | 'LINKEDIN_POST'
    | 'TWEET_THREAD'
    | 'BLOG_POST'
    | 'NEWSLETTER'
    | 'PRESS_RELEASE'
    | 'PRODUCT_DESCRIPTION'
    | 'VIDEO_SCRIPT'
    | 'PODCAST_OUTLINE'
    | 'SALES_PITCH'
    | 'BUG_REPORT'
    | 'DESIGN_FEEDBACK'
    | 'BRAINSTORM';
export type DocLength = 'VERY_CONCISE' | 'CONCISE' | 'BALANCED' | 'DETAILED' | 'VERY_DETAILED';
export type WritingStyle = 'CONVERSATIONAL' | 'PROFESSIONAL' | 'CREATIVE' | 'DIRECT' | 'TECHNICAL';

export interface ProcessingConfig {
    docType: DocType;
    length: DocLength;
    style: WritingStyle;
}

export interface UserProfile {
    id: string;
    email: string;
    is_pro: boolean;
    created_at: string;
}

export interface HistoryItem {
    id: string;
    title: string;
    transcript: string;
    result: string;
    config: ProcessingConfig;
    created_at: string;
}

// Subscription types
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused' | 'on_trial';
export type BillingPeriod = 'month' | 'year';

export interface Subscription {
    id: string;
    user_id: string;
    lemon_squeezy_id: string;
    order_id: string | null;
    product_id: string;
    variant_id: string;
    variant_name: string;
    status: SubscriptionStatus;
    renews_at: string | null;
    ends_at: string | null;
    trial_ends_at: string | null;
    price_cents: number;
    billing_period: BillingPeriod | null;
    created_at: string;
    updated_at: string;
}

export interface LemonSqueezyWebhookPayload {
    meta: {
        event_name: string;
        custom_data?: {
            user_id?: string;
            user_email?: string;
        };
    };
    data: {
        id: string;
        type: string;
        attributes: {
            store_id: number;
            order_id: number;
            product_id: number;
            variant_id: number;
            variant_name: string;
            user_email: string;
            status: string;
            renews_at: string | null;
            ends_at: string | null;
            trial_ends_at: string | null;
            first_subscription_item?: {
                price: number;
            };
        };
    };
}
