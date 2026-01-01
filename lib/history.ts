import { HistoryItem, ProcessingConfig } from '@/types';
import { createClient } from './supabase/client';

const LOCAL_STORAGE_KEY = 'vocalize_history';
const FREE_LIMIT = 5;
const PRO_LIMIT = 100;

// Generate a simple ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate title from result (first 50 chars)
function generateTitle(result: string): string {
    const cleaned = result.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim();
    const firstLine = cleaned.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
}

// ===== LOCAL STORAGE (Free Tier) =====

export function getLocalHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveLocalHistory(
    transcript: string,
    result: string,
    config: ProcessingConfig
): HistoryItem {
    const history = getLocalHistory();
    const item: HistoryItem = {
        id: generateId(),
        title: generateTitle(result),
        transcript,
        result,
        config,
        created_at: new Date().toISOString(),
    };

    // Add to front, keep only FREE_LIMIT items
    const updated = [item, ...history].slice(0, FREE_LIMIT);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return item;
}

export function deleteLocalHistory(id: string): void {
    const history = getLocalHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

// ===== SUPABASE (Pro Tier) =====

export async function getCloudHistory(userId: string): Promise<HistoryItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PRO_LIMIT);

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        title: row.title,
        transcript: row.transcript,
        result: row.result,
        config: {
            docType: row.doc_type,
            length: row.length,
            style: row.style,
        },
        created_at: row.created_at,
    }));
}

export async function saveCloudHistory(
    userId: string,
    transcript: string,
    result: string,
    config: ProcessingConfig
): Promise<HistoryItem | null> {
    const supabase = createClient();
    const title = generateTitle(result);

    const { data, error } = await supabase
        .from('history')
        .insert({
            user_id: userId,
            title,
            transcript,
            result,
            doc_type: config.docType,
            length: config.length,
            style: config.style,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving history:', error);
        return null;
    }

    // Enforce PRO_LIMIT by deleting oldest entries
    const { count } = await supabase
        .from('history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (count && count > PRO_LIMIT) {
        const { data: oldest } = await supabase
            .from('history')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(count - PRO_LIMIT);

        if (oldest && oldest.length > 0) {
            await supabase
                .from('history')
                .delete()
                .in('id', oldest.map(o => o.id));
        }
    }

    return {
        id: data.id,
        title: data.title,
        transcript: data.transcript,
        result: data.result,
        config,
        created_at: data.created_at,
    };
}

export async function deleteCloudHistory(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting history:', error);
        return false;
    }
    return true;
}
