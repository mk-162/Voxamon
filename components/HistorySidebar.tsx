'use client';

import { HistoryItem } from '@/types';
import { XMarkIcon, TrashIcon, DocumentDuplicateIcon, ClockIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    isPro: boolean;
    onSelectItem: (item: HistoryItem) => void;
    onDeleteItem: (id: string) => void;
    onUpgrade: () => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function formatDocType(docType: string): string {
    return docType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function HistorySidebar({
    isOpen,
    onClose,
    history,
    isPro,
    onSelectItem,
    onDeleteItem,
    onUpgrade,
}: HistorySidebarProps) {
    if (!isOpen) return null;

    const handleCopy = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteItem(id);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-ink-base/80 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-surface border-l border-ink-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-border">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-oxide-red" />
                        <h2 className="text-lg font-serif text-paper-text">History</h2>
                        {isPro && (
                            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-oxide-red bg-oxide-red/10 px-2 py-0.5 rounded">
                                Pro
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-paper-muted hover:text-paper-text transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <ClockIcon className="w-12 h-12 text-ink-border mb-4" />
                            <p className="text-paper-muted text-sm mb-2">No history yet</p>
                            <p className="text-paper-muted/60 text-xs">
                                Your generated content will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-ink-border/50">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelectItem(item)}
                                    className="px-6 py-4 hover:bg-ink-base/50 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-paper-text font-medium truncate mb-1">
                                                {item.title}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-paper-muted">
                                                <span className="uppercase tracking-wider">
                                                    {formatDocType(item.config.docType)}
                                                </span>
                                                <span className="text-ink-border">•</span>
                                                <span>{formatDate(item.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleCopy(item.result, e)}
                                                className="w-7 h-7 flex items-center justify-center text-paper-muted hover:text-paper-text hover:bg-ink-base rounded transition-colors"
                                                title="Copy"
                                            >
                                                <DocumentDuplicateIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="w-7 h-7 flex items-center justify-center text-paper-muted hover:text-red-400 hover:bg-ink-base rounded transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Upgrade prompt for free users */}
                {!isPro && (
                    <div className="border-t border-ink-border p-4 bg-ink-base/50">
                        <div className="flex items-start gap-3 mb-3">
                            <StarIcon className="w-5 h-5 text-oxide-red shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-paper-text font-medium">
                                    Upgrade to Pro
                                </p>
                                <p className="text-xs text-paper-muted mt-1">
                                    Get cloud sync & save up to 100 items
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="w-full bg-oxide-red hover:bg-orange-700 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 transition-colors"
                        >
                            Upgrade - $9/mo
                        </button>
                    </div>
                )}

                {/* Footer - Pro user info */}
                {isPro && (
                    <div className="border-t border-ink-border px-6 py-3 bg-ink-base/30">
                        <p className="text-[10px] text-paper-muted uppercase tracking-widest">
                            {history.length} / 100 items saved
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
