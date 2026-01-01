'use client';

import React, { useState } from 'react';
import {
    SiWhatsapp, SiX, SiLinkedin, SiSlack, SiDiscord,
    SiNotion, SiObsidian, SiTelegram, SiGmail,
    SiGoogledocs, SiWordpress, SiMedium, SiEvernote, SiTrello, SiAsana, SiHubspot
} from 'react-icons/si';
import { EnvelopeIcon, ChatBubbleLeftIcon, StarIcon, XMarkIcon, BuildingOffice2Icon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
import { Integration, getIntegrationsForContentType } from '@/lib/integrations';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    'mail': EnvelopeIcon,
    'message': ChatBubbleLeftIcon,
    'SiWhatsapp': SiWhatsapp,
    'SiX': SiX,
    'SiLinkedin': SiLinkedin,
    'SiSlack': SiSlack,
    'SiDiscord': SiDiscord,
    'SiMicrosoftteams': BuildingOffice2Icon, // Fallback
    'SiNotion': SiNotion,
    'SiObsidian': SiObsidian,
    'SiTelegram': SiTelegram,
    'SiGmail': SiGmail,
    'SiMicrosoftoutlook': ComputerDesktopIcon, // Fallback
    'SiGoogledocs': SiGoogledocs,
    'SiWordpress': SiWordpress,
    'SiMedium': SiMedium,
    'SiEvernote': SiEvernote,
    'SiTrello': SiTrello,
    'SiAsana': SiAsana,
    'SiHubspot': SiHubspot,
};

interface Props {
    contentType: string;
    maxVisible?: number;
    onUpgrade: () => void;
    text?: string; // Content to share
}

// Generate share URLs for Tier 1 integrations
function generateShareUrl(integrationId: string, text: string): string | null {
    const encodedText = encodeURIComponent(text);
    const truncatedText = text.length > 280 ? text.slice(0, 277) + '...' : text;
    const encodedTruncated = encodeURIComponent(truncatedText);

    switch (integrationId) {
        case 'email':
            return `mailto:?subject=${encodeURIComponent('Shared from Vocalize')}&body=${encodedText}`;
        case 'whatsapp':
            return `https://wa.me/?text=${encodedText}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?text=${encodedTruncated}`;
        case 'linkedin':
            // LinkedIn requires a URL context, we'll share as text
            return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`;
        case 'sms':
            return `sms:?body=${encodedText}`;
        default:
            return null;
    }
}

export default function IntegrationGrid({ contentType, maxVisible = 4, onUpgrade, text = '' }: Props) {
    const [showAll, setShowAll] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

    const relevantIntegrations = getIntegrationsForContentType(contentType);
    const displayIntegrations = showAll ? relevantIntegrations : relevantIntegrations.slice(0, maxVisible);
    const hiddenCount = Math.max(0, relevantIntegrations.length - maxVisible);

    const handleClick = (integration: Integration) => {
        // Tier 1 integrations work immediately (free)
        if (integration.tier === 1 && text) {
            const shareUrl = generateShareUrl(integration.id, text);
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'noopener,noreferrer');
                return;
            }
        }

        // Tier 2/3 show Coming Soon modal
        setSelectedIntegration(integration);
    };

    return (
        <>
            <div className="flex items-center gap-2 flex-wrap">
                {displayIntegrations.map((integration) => {
                    const IconComponent = iconMap[integration.iconName];
                    if (!IconComponent) return null;

                    return (
                        <button
                            key={integration.id}
                            onClick={() => handleClick(integration)}
                            className="w-8 h-8  bg-ink-surface border border-ink-border flex items-center justify-center hover:border-paper-muted hover:scale-110 transition-all group relative"
                            title={integration.name}
                        >
                            <IconComponent
                                className="w-4 h-4"
                                style={{ color: integration.color }}
                            />
                        </button>
                    );
                })}

                {!showAll && hiddenCount > 0 && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="h-8 px-3  bg-ink-surface border border-ink-border text-[10px] font-bold uppercase tracking-wide text-paper-muted hover:text-paper-text hover:border-paper-muted transition-all"
                    >
                        +{hiddenCount} more
                    </button>
                )}

                {showAll && hiddenCount > 0 && (
                    <button
                        onClick={() => setShowAll(false)}
                        className="h-8 px-3  bg-ink-surface border border-ink-border text-[10px] font-bold uppercase tracking-wide text-paper-muted hover:text-paper-text hover:border-paper-muted transition-all"
                    >
                        Show less
                    </button>
                )}
            </div>

            {/* Coming Soon Modal */}
            {selectedIntegration && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-ink-base/90 backdrop-blur-md" onClick={() => setSelectedIntegration(null)} />
                    <div className="relative bg-ink-surface border border-ink-border  max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-ink-base p-6 text-center border-b border-ink-border relative">
                            <button
                                onClick={() => setSelectedIntegration(null)}
                                className="absolute top-4 right-4 text-paper-muted hover:text-paper-text"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                            <div className="mx-auto w-16 h-16 border border-ink-border rounded-full flex items-center justify-center mb-4">
                                {(() => {
                                    const IconComponent = iconMap[selectedIntegration.iconName];
                                    return IconComponent ? (
                                        <IconComponent className="w-8 h-8" style={{ color: selectedIntegration.color }} />
                                    ) : null;
                                })()}
                            </div>

                            <h2 className="text-xl font-medium text-paper-text tracking-tight mb-1">
                                {selectedIntegration.name}
                            </h2>
                            <p className="text-oxide-red text-xs uppercase tracking-widest font-bold">
                                Coming Soon
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 text-center">
                            <p className="text-sm text-paper-muted leading-relaxed mb-6">
                                Direct integration with <strong className="text-paper-text">{selectedIntegration.name}</strong> is a <span className="text-oxide-red font-bold">premium-only feature</span>.
                            </p>
                            <p className="text-xs text-paper-muted mb-6">
                                Upgrade now to unlock all integrations when they launch.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-ink-base border-t border-ink-border flex flex-col gap-3">
                            <button
                                onClick={() => { setSelectedIntegration(null); onUpgrade(); }}
                                className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3  transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-oxide-red/20"
                            >
                                <StarIcon className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                            <button
                                onClick={() => setSelectedIntegration(null)}
                                className="w-full text-paper-muted text-xs hover:text-paper-text transition-colors uppercase tracking-widest"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
