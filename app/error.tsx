'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-ink-base text-paper-text p-6">
            <div className="bg-ink-surface border border-ink-border max-w-md w-full p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mb-6">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-medium mb-2">Something went wrong</h1>
                <p className="text-paper-muted text-sm mb-6">
                    An unexpected error occurred. Please try again.
                </p>

                {error.message && (
                    <div className="bg-ink-base border border-ink-border p-3 mb-6 text-left">
                        <p className="text-xs text-paper-muted font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3 transition-colors text-sm uppercase tracking-wider"
                    >
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="w-full text-paper-muted text-xs hover:text-paper-text transition-colors uppercase tracking-widest text-center py-2"
                    >
                        Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}
