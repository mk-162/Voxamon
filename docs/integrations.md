# Vocalize Integrations Documentation

This document outlines the integration tiers and their access levels for help page creation.

---

## Integration Tiers

### Tier 1: Free (URL-based)

**Available to all users without login.**

These integrations work by opening a URL with pre-filled content. No backend required.

| Integration | URL Scheme | Notes |
|-------------|-----------|-------|
| **Email** | `mailto:?subject=...&body=...` | Opens default email client |
| **WhatsApp** | `https://wa.me/?text=...` | Opens WhatsApp with message |
| **Twitter/X** | `https://twitter.com/intent/tweet?text=...` | Opens tweet composer |
| **LinkedIn** | `https://www.linkedin.com/sharing/share-offsite/?url=...` | Share to LinkedIn |
| **SMS** | `sms:?body=...` | Opens native SMS app |

### Tier 2: Premium (Webhook-based)

**Requires Pro subscription.**

These integrations use webhooks or simple APIs.

| Integration | Method | Notes |
|-------------|--------|-------|
| **Slack** | Incoming Webhook | User provides webhook URL |
| **Discord** | Incoming Webhook | User provides webhook URL |
| **Teams** | Incoming Webhook | User provides webhook URL |
| **Notion** | Public API | OAuth required |
| **Obsidian** | `obsidian://` URL | Local vault integration |
| **Telegram** | Bot API | Requires bot token + chat ID |

### Tier 3: Premium (OAuth-based)

**Requires Pro subscription + account connection.**

These integrations require full OAuth authentication.

| Integration | OAuth Provider | Notes |
|-------------|---------------|-------|
| **Gmail** | Google OAuth | Sends via Gmail API |
| **Outlook** | Microsoft OAuth | Sends via Graph API |
| **Google Docs** | Google OAuth | Creates new document |
| **WordPress** | REST API | Requires auth plugin |
| **Medium** | Medium OAuth | Creates draft post |
| **Evernote** | Evernote OAuth | Creates note |
| **Trello** | Atlassian OAuth | Creates card |
| **Asana** | Asana OAuth | Creates task |
| **HubSpot** | HubSpot OAuth | Creates CRM entry |

---

## Character Limits

| Platform | Character Limit |
|----------|----------------|
| Twitter/X | 280 characters |
| WhatsApp | ~65,000 characters |
| SMS | 160 characters (or multi-part) |
| LinkedIn | 3,000 characters |
| Email | No practical limit |

---

## Help Page Content Suggestions

### For Free Users
>
> **Share Instantly**: Copy your content to Email, WhatsApp, Twitter, LinkedIn, or SMS with one click. No account needed!

### For Pro Users
>
> **Pro Integrations**: Connect directly to Slack, Notion, Discord, and more. Your content flows seamlessly into your favorite apps.

---

## Implementation Notes

- Tier 1: Opens new tab/window with URL
- Tier 2/3: Shows "Coming Soon + Upgrade" modal
- Content is URL-encoded before sharing
- Long content may be truncated for platforms with limits
