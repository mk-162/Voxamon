'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-[#0a0a0a] text-[#e5e5e5]">
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] max-w-md w-full p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mb-6">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-medium mb-2">Critical Error</h1>
                        <p className="text-[#a0a0a0] text-sm mb-6">
                            A critical error occurred. Please refresh the page.
                        </p>

                        <button
                            onClick={reset}
                            className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium py-3 transition-colors text-sm uppercase tracking-wider"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
