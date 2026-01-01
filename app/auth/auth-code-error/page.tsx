'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-ink-base text-paper-text p-6">
            <div className="bg-ink-surface border border-ink-border max-w-md w-full p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mb-6">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-medium mb-2">Authentication Failed</h1>
                <p className="text-paper-muted text-sm mb-6">
                    We couldn't complete the sign-in process. This might happen if:
                </p>

                <ul className="text-left text-sm text-paper-muted space-y-2 mb-8">
                    <li className="flex items-start gap-2">
                        <span className="text-oxide-red">•</span>
                        The authentication link expired
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-oxide-red">•</span>
                        You denied access to your account
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-oxide-red">•</span>
                        There was a temporary server issue
                    </li>
                </ul>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/login"
                        className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3 transition-colors text-sm uppercase tracking-wider"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="w-full text-paper-muted text-xs hover:text-paper-text transition-colors uppercase tracking-widest"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
