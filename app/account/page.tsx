'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionStatus, getPortalUrl } from '@/app/actions/subscriptions';
import { getSubscriptionStatusText, formatSubscriptionDate, isSubscriptionActive } from '@/lib/subscriptions';
import { PLANS } from '@/lib/pricing';
import { Subscription } from '@/types';
import {
    UserCircleIcon,
    CreditCardIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    StarIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';

function AccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    const justUpgraded = searchParams.get('upgraded') === 'true';

    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login?redirect=/account');
                return;
            }

            setUser(user);

            const result = await getSubscriptionStatus();
            if (result.success) {
                setSubscription(result.subscription || null);
            }

            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleManageBilling = async () => {
        setPortalLoading(true);
        const result = await getPortalUrl();
        if (result.success && result.portalUrl) {
            window.location.href = result.portalUrl;
        } else {
            alert(result.error || 'Unable to open billing portal');
        }
        setPortalLoading(false);
    };

    const isPro = subscription && isSubscriptionActive(subscription);
    const currentPlan = isPro ? PLANS.PRO_MONTHLY : PLANS.FREE;

    if (loading) {
        return (
            <div className="min-h-screen bg-ink-base flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-oxide-red border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ink-base text-paper-text">
            {/* Header */}
            <header className="border-b border-ink-border bg-ink-base/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-paper-muted hover:text-paper-text transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest font-bold">Back</span>
                    </Link>
                    <h1 className="text-lg font-serif">Account</h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
                {/* Success Message */}
                {justUpgraded && (
                    <div className="bg-green-950/30 border border-green-900/50 p-4 flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        <div>
                            <p className="text-sm font-medium text-green-200">Welcome to Pro!</p>
                            <p className="text-xs text-green-300/70">Your subscription is now active.</p>
                        </div>
                    </div>
                )}

                {/* Profile Section */}
                <section className="bg-ink-surface border border-ink-border">
                    <div className="px-6 py-4 border-b border-ink-border">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-paper-muted flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" />
                            Profile
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-ink-base border border-ink-border flex items-center justify-center">
                                <UserCircleIcon className="w-10 h-10 text-paper-muted" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">{user?.email}</p>
                                <p className="text-xs text-paper-muted">
                                    Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Subscription Section */}
                <section className="bg-ink-surface border border-ink-border">
                    <div className="px-6 py-4 border-b border-ink-border">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-paper-muted flex items-center gap-2">
                            <CreditCardIcon className="w-4 h-4" />
                            Subscription
                        </h2>
                    </div>
                    <div className="p-6">
                        {/* Current Plan */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-medium">{isPro ? 'Pro Plan' : 'Free Plan'}</h3>
                                    {isPro && (
                                        <span className="bg-oxide-red/20 text-oxide-red text-[10px] uppercase tracking-widest font-bold px-2 py-0.5">
                                            Active
                                        </span>
                                    )}
                                </div>
                                {subscription && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm text-paper-muted">
                                            Status: {getSubscriptionStatusText(subscription)}
                                        </p>
                                        {subscription.renews_at && subscription.status === 'active' && (
                                            <p className="text-sm text-paper-muted">
                                                Renews: {formatSubscriptionDate(subscription.renews_at)}
                                            </p>
                                        )}
                                        {subscription.ends_at && subscription.status === 'cancelled' && (
                                            <p className="text-sm text-paper-muted">
                                                Active until: {formatSubscriptionDate(subscription.ends_at)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {isPro ? (subscription?.billing_period === 'year' ? '$54' : '$9') : '$0'}
                                </p>
                                <p className="text-xs text-paper-muted">
                                    {isPro ? (subscription?.billing_period === 'year' ? '/year' : '/month') : 'forever'}
                                </p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mb-6 p-4 bg-ink-base border border-ink-border">
                            <p className="text-xs uppercase tracking-widest font-bold text-paper-muted mb-3">Your Features</p>
                            <ul className="space-y-2">
                                {currentPlan.features.filter(f => f.included).map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <CheckCircleIcon className="w-4 h-4 text-oxide-red" />
                                        {feature.text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {isPro ? (
                                <button
                                    onClick={handleManageBilling}
                                    disabled={portalLoading}
                                    className="flex-1 bg-ink-base border border-ink-border hover:border-paper-muted text-paper-text text-xs uppercase tracking-widest font-bold px-6 py-3 transition-colors disabled:opacity-50"
                                >
                                    {portalLoading ? 'Loading...' : 'Manage Billing'}
                                </button>
                            ) : (
                                <Link
                                    href="/?upgrade=true"
                                    className="flex-1 bg-oxide-red hover:bg-orange-700 text-white text-xs uppercase tracking-widest font-bold px-6 py-3 transition-colors text-center flex items-center justify-center gap-2"
                                >
                                    <StarIcon className="w-4 h-4" />
                                    Upgrade to Pro
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-ink-surface border border-ink-border">
                    <div className="px-6 py-4 border-b border-ink-border">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-red-400">
                            Danger Zone
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-paper-muted mb-4">
                            Need to delete your account? Contact us at support@vocalize.app
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

function AccountLoading() {
    return (
        <div className="min-h-screen bg-ink-base flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-oxide-red border-t-transparent rounded-full" />
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<AccountLoading />}>
            <AccountContent />
        </Suspense>
    );
}
