// Integration definitions with content-type mappings
// Icons from react-icons/si (Simple Icons)

export interface Integration {
    id: string;
    name: string;
    iconName: string; // react-icons/si component name
    contentTypes: string[]; // Which content types this integration is relevant for
    tier: 1 | 2 | 3; // 1 = URL-based (easy), 2 = API-based, 3 = OAuth-based
    color: string; // Brand color for icon
}

export const INTEGRATIONS: Integration[] = [
    // Tier 1: URL-based (trivial to implement)
    { id: 'email', name: 'Email', iconName: 'mail', contentTypes: ['EMAIL_DRAFT', 'SALES_PITCH', 'NEWSLETTER'], tier: 1, color: '#EA4335' },
    { id: 'whatsapp', name: 'WhatsApp', iconName: 'SiWhatsapp', contentTypes: ['SUMMARY', 'LINKEDIN_POST', 'TWEET_THREAD'], tier: 1, color: '#25D366' },
    { id: 'twitter', name: 'Twitter/X', iconName: 'SiX', contentTypes: ['TWEET_THREAD', 'LINKEDIN_POST'], tier: 1, color: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', iconName: 'SiLinkedin', contentTypes: ['LINKEDIN_POST', 'SALES_PITCH', 'NEWSLETTER'], tier: 1, color: '#0A66C2' },
    { id: 'sms', name: 'SMS', iconName: 'message', contentTypes: ['SUMMARY'], tier: 1, color: '#34C759' },

    // Tier 2: Simple API / Webhook
    { id: 'slack', name: 'Slack', iconName: 'SiSlack', contentTypes: ['SUMMARY', 'MEETING_NOTES', 'BUG_REPORT'], tier: 2, color: '#4A154B' },
    { id: 'discord', name: 'Discord', iconName: 'SiDiscord', contentTypes: ['SUMMARY', 'MEETING_NOTES'], tier: 2, color: '#5865F2' },
    { id: 'teams', name: 'Teams', iconName: 'SiMicrosoftteams', contentTypes: ['SUMMARY', 'MEETING_NOTES'], tier: 2, color: '#6264A7' },
    { id: 'notion', name: 'Notion', iconName: 'SiNotion', contentTypes: ['SUMMARY', 'MEETING_NOTES', 'BLOG_POST', 'BRAINSTORM'], tier: 2, color: '#000000' },
    { id: 'obsidian', name: 'Obsidian', iconName: 'SiObsidian', contentTypes: ['SUMMARY', 'MEETING_NOTES', 'BRAINSTORM'], tier: 2, color: '#7C3AED' },
    { id: 'telegram', name: 'Telegram', iconName: 'SiTelegram', contentTypes: ['SUMMARY', 'LINKEDIN_POST'], tier: 2, color: '#26A5E4' },

    // Tier 3: OAuth + Complex APIs
    { id: 'gmail', name: 'Gmail', iconName: 'SiGmail', contentTypes: ['EMAIL_DRAFT', 'SALES_PITCH', 'NEWSLETTER'], tier: 3, color: '#EA4335' },
    { id: 'outlook', name: 'Outlook', iconName: 'SiMicrosoftoutlook', contentTypes: ['EMAIL_DRAFT', 'SALES_PITCH'], tier: 3, color: '#0078D4' },
    { id: 'googledocs', name: 'Google Docs', iconName: 'SiGoogledocs', contentTypes: ['SUMMARY', 'MEETING_NOTES', 'BLOG_POST'], tier: 3, color: '#4285F4' },
    { id: 'wordpress', name: 'WordPress', iconName: 'SiWordpress', contentTypes: ['BLOG_POST', 'NEWSLETTER'], tier: 3, color: '#21759B' },
    { id: 'medium', name: 'Medium', iconName: 'SiMedium', contentTypes: ['BLOG_POST', 'NEWSLETTER'], tier: 3, color: '#000000' },
    { id: 'evernote', name: 'Evernote', iconName: 'SiEvernote', contentTypes: ['SUMMARY', 'MEETING_NOTES'], tier: 3, color: '#00A82D' },
    { id: 'trello', name: 'Trello', iconName: 'SiTrello', contentTypes: ['MEETING_NOTES', 'BUG_REPORT'], tier: 3, color: '#0052CC' },
    { id: 'asana', name: 'Asana', iconName: 'SiAsana', contentTypes: ['MEETING_NOTES', 'BUG_REPORT'], tier: 3, color: '#F06A6A' },
    { id: 'hubspot', name: 'HubSpot', iconName: 'SiHubspot', contentTypes: ['SALES_PITCH', 'EMAIL_DRAFT'], tier: 3, color: '#FF7A59' },
];

// Get integrations relevant to a content type, sorted by tier (easiest first)
export function getIntegrationsForContentType(contentType: string, limit?: number): Integration[] {
    const relevant = INTEGRATIONS
        .filter(i => i.contentTypes.includes(contentType))
        .sort((a, b) => a.tier - b.tier);

    return limit ? relevant.slice(0, limit) : relevant;
}

// Get all integrations sorted by tier
export function getAllIntegrations(): Integration[] {
    return [...INTEGRATIONS].sort((a, b) => a.tier - b.tier);
}
