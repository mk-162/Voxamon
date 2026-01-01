import { BillingPeriod } from '@/types';

export interface PlanFeature {
    text: string;
    included: boolean;
}

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    priceDisplay: string;
    period?: BillingPeriod;
    variantId?: string;
    recordingLimit: number; // seconds
    historyLimit: number;
    features: PlanFeature[];
    popular?: boolean;
    savings?: string;
}

export const PLANS: Record<string, Plan> = {
    FREE: {
        id: 'free',
        name: 'Free',
        description: 'Get started with voice-to-text',
        price: 0,
        priceDisplay: '$0',
        recordingLimit: 120, // 2 minutes
        historyLimit: 5,
        features: [
            { text: '2-minute recordings', included: true },
            { text: 'Browser-based history (5 items)', included: true },
            { text: 'Basic export formats', included: true },
            { text: 'URL-based sharing', included: true },
            { text: 'Cloud history sync', included: false },
            { text: 'All export formats', included: false },
            { text: 'Direct integrations', included: false },
        ],
    },
    PRO_MONTHLY: {
        id: 'pro_monthly',
        name: 'Pro',
        description: 'For power users who need more',
        price: 9,
        priceDisplay: '$9/mo',
        period: 'month',
        variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_MONTHLY || '',
        recordingLimit: 1800, // 30 minutes
        historyLimit: 100,
        features: [
            { text: '30-minute recordings', included: true },
            { text: 'Cloud history (100 items)', included: true },
            { text: 'All export formats', included: true },
            { text: 'Direct integrations', included: true },
            { text: 'Priority support', included: true },
        ],
    },
    PRO_ANNUAL: {
        id: 'pro_annual',
        name: 'Pro Annual',
        description: 'Best value - save 50%',
        price: 54,
        priceDisplay: '$54/yr',
        period: 'year',
        variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ANNUAL || '',
        recordingLimit: 1800,
        historyLimit: 100,
        popular: true,
        savings: '50%',
        features: [
            { text: '30-minute recordings', included: true },
            { text: 'Cloud history (100 items)', included: true },
            { text: 'All export formats', included: true },
            { text: 'Direct integrations', included: true },
            { text: 'Priority support', included: true },
        ],
    },
};

export function getPlanByVariantId(variantId: string): Plan | undefined {
    return Object.values(PLANS).find(plan => plan.variantId === variantId);
}

export function getProPlans(): Plan[] {
    return [PLANS.PRO_MONTHLY, PLANS.PRO_ANNUAL];
}

export function formatPrice(cents: number, period?: BillingPeriod): string {
    const dollars = cents / 100;
    if (period === 'month') return `$${dollars}/mo`;
    if (period === 'year') return `$${dollars}/yr`;
    return `$${dollars}`;
}
