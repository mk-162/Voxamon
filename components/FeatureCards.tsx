'use client';

import React from 'react';
import {
    SiWhatsapp, SiX, SiLinkedin, SiSlack, SiDiscord,
    SiNotion, SiTelegram, SiGmail, SiTrello
} from 'react-icons/si';
import { MicrophoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

// Top integrations to show (most recognizable)
const FEATURED_LOGOS = [
    { icon: SiSlack, name: 'Slack' },
    { icon: SiNotion, name: 'Notion' },
    { icon: SiLinkedin, name: 'LinkedIn' },
    { icon: SiX, name: 'Twitter/X' },
    { icon: SiWhatsapp, name: 'WhatsApp' },
    { icon: EnvelopeIcon, name: 'Email' },
    { icon: SiGmail, name: 'Gmail' },
    { icon: SiDiscord, name: 'Discord' },
    { icon: SiTelegram, name: 'Telegram' },
    { icon: SiTrello, name: 'Trello' },
];

export default function FeatureCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {/* Card 1: Voice Power */}
            <div className="bg-ink-surface border border-ink-border p-6 hover:border-paper-muted transition-all duration-300 group">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-oxide-red/10 border border-oxide-red/20 flex items-center justify-center shrink-0">
                        <MicrophoneIcon className="w-5 h-5 text-oxide-red" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-paper-text mb-1 group-hover:text-oxide-red transition-colors">
                            From ramble to ready
                        </h3>
                        <p className="text-sm text-paper-muted leading-relaxed">
                            Messy thoughts in, clear content out. No editing required.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 2: Share Anywhere */}
            <div className="bg-ink-surface border border-ink-border p-6 hover:border-paper-muted transition-all duration-300 group">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-oxide-red/10 border border-oxide-red/20 flex items-center justify-center shrink-0">
                            <SiSlack className="w-5 h-5 text-oxide-red" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-paper-text mb-1 group-hover:text-oxide-red transition-colors">
                                Share anywhere, instantly
                            </h3>
                            <p className="text-sm text-paper-muted leading-relaxed">
                                One click to your favorite apps.
                            </p>
                        </div>
                    </div>

                    {/* Logo Grid - All in Oxide Red */}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {FEATURED_LOGOS.slice(0, 8).map((logo, i) => {
                            const IconComponent = logo.icon;
                            return (
                                <div
                                    key={i}
                                    className="w-7 h-7  bg-ink-base/50 border border-ink-border/50 flex items-center justify-center"
                                    title={logo.name}
                                >
                                    <IconComponent className="w-3.5 h-3.5 text-oxide-red opacity-80" />
                                </div>
                            );
                        })}
                        <div className="h-7 px-2  bg-ink-base/50 border border-ink-border/50 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-paper-muted">+12</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
