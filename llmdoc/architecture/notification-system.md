# Notification System Architecture

## Overview
Multi-channel notification system for todos, subscriptions, and anniversaries.

## Supported Channels
- **Telegram**: Bot-based notifications
- **Webhook**: HTTP POST to custom URL
- **WeCom** (企业微信): Enterprise messaging
- **Email**: SMTP-based emails

**Definition**: `src/lib/notifications.ts:1-22`

## Architecture Flow
```
Cron API → collectDueNotificationCandidates() → NotificationCandidate[]
    ↓
For each channel → Send notification → Log to notification_deliveries
```

## Core Components

### Notification Candidate Collection
**Location**: `src/server/notifications.ts:66-206`

`collectDueNotificationCandidates({ now, timeZone, dateReminderTime, lookbackHours })`

Process:
1. Query active todos with `dueAt` and reminders
2. Query active anniversaries with reminders
3. Query active subscriptions with reminders
4. For each item, calculate `scheduledAt` based on offsets
5. Filter by lookback window (default 24 hours)
6. Return sorted candidates

### Notification Candidate Type
```typescript
type NotificationCandidate = {
  itemType: "todo" | "anniversary" | "subscription";
  itemId: string;
  itemTitle: string;
  scheduledAt: Date;
  offsetLabel: string;  // "到期时" / "提前 1 天"
  eventLabel: string;   // "截止" / "日期" / "到期"
  eventValue: string;
  eventAt: Date;
  path: string;         // "/todo/{id}"
};
```

### Delivery ID Format
`{channel}:{itemType}:{itemId}:{scheduledAtMs}`

Prevents duplicate notifications.

### Notification Senders
**Location**: `src/server/notification-senders.ts`

Factory function `createSenders(settings, channel)` returns:
- `sendTest(nowIso)` - Send test notification
- `sendCandidate(candidate)` - Send actual notification

Internal sender functions per channel:
- `sendTelegramMessage({ botToken, chatId, text })`
- `sendWebhookMessage({ webhookUrl, payload })`
- `sendWecomWebhookMessage({ webhookUrl, text })`
- `sendEmailMessage({ host, port, secure, user, pass, from, to, subject, text })`

## Settings Storage
**Table**: `app_settings`
**Location**: `src/server/db/schema.ts:91-124`

Per-channel configuration:
- `{channel}Enabled`: boolean toggle
- Channel-specific credentials (tokens, URLs, SMTP config)

## API Endpoint
**Location**: `src/app/api/cron/notify/route.ts`

Called by external cron to trigger notification processing.

## Server Actions
**Location**: `src/app/_actions/notifications.ts`

- `sendTestNotification(formData)` - Test channel configuration
- Notification settings management

## Delivery Tracking
**Table**: `notification_deliveries`

Status: `sending` → `sent` | `failed`

Tracks:
- When scheduled
- When sent
- Error messages
