'use client';

import { useState } from 'react';
import { createCheckout } from '@/app/actions/subscriptions';
import { PLANS, getProPlans, Plan } from '@/lib/pricing';
import {
    XMarkIcon,
    StarIcon,
    CheckCircleIcon,
    SparklesIcon,
} from '@heroicons/react/24/solid';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginRequired?: () => void;
}

export default function PricingModal({ isOpen, onClose, onLoginRequired }: PricingModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const proPlans = getProPlans();
    const monthlyPlan = PLANS.PRO_MONTHLY;
    const annualPlan = PLANS.PRO_ANNUAL;

    const handleCheckout = async () => {
        const plan = selectedPlan === 'annual' ? annualPlan : monthlyPlan;

        if (!plan.variantId) {
            setError('Payment not configured. Please contact support.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await createCheckout(plan.variantId);

        if (result.success && result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
        } else {
            if (result.error === 'Please sign in to upgrade') {
                onLoginRequired?.();
            } else {
                setError(result.error || 'Failed to start checkout');
            }
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-ink-base/90 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-ink-surface border border-ink-border max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
                {/* Header */}
                <div className="bg-ink-base p-6 text-center border-b border-ink-border relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-paper-muted hover:text-paper-text transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <div className="mx-auto w-12 h-12 border border-oxide-red/30 rounded-full flex items-center justify-center mb-4 bg-oxide-red/10">
                        <SparklesIcon className="w-6 h-6 text-oxide-red" />
                    </div>
                    <h2 className="text-xl font-medium text-paper-text tracking-tight mb-1">
                        Upgrade to Pro
                    </h2>
                    <p className="text-paper-muted text-xs uppercase tracking-widest">
                        Unlock Your Full Potential
                    </p>
                </div>

                {/* Plan Toggle */}
                <div className="p-6 border-b border-ink-border">
                    <div className="flex bg-ink-base border border-ink-border rounded-sm overflow-hidden">
                        <button
                            onClick={() => setSelectedPlan('monthly')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${
                                selectedPlan === 'monthly'
                                    ? 'bg-ink-surface text-paper-text'
                                    : 'text-paper-muted hover:text-paper-text'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedPlan('annual')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-colors relative ${
                                selectedPlan === 'annual'
                                    ? 'bg-ink-surface text-paper-text'
                                    : 'text-paper-muted hover:text-paper-text'
                            }`}
                        >
                            Annual
                            <span className="absolute -top-2 right-2 bg-oxide-red text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold">
                                -50%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Display */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-paper-text">
                                ${selectedPlan === 'annual' ? '54' : '9'}
                            </span>
                            <span className="text-paper-muted text-sm">
                                /{selectedPlan === 'annual' ? 'year' : 'month'}
                            </span>
                        </div>
                        {selectedPlan === 'annual' && (
                            <p className="text-oxide-red text-xs mt-1">
                                Just $4.50/month - Save $54/year
                            </p>
                        )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                        {monthlyPlan.features.filter(f => f.included).map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircleIcon className="w-4 h-4 text-oxide-red shrink-0" />
                                <span className="text-sm text-paper-text">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-4 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-oxide-red/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <StarIcon className="w-4 h-4" />
                                Start Pro {selectedPlan === 'annual' ? 'Annual' : 'Monthly'}
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-ink-base border-t border-ink-border text-center">
                    <p className="text-[10px] text-paper-muted uppercase tracking-widest">
                        Cancel anytime • Secure checkout by Lemon Squeezy
                    </p>
                </div>
            </div>
        </div>
    );
}
