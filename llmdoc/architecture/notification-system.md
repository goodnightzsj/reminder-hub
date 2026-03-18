# Notification System Architecture

## Overview
Multi-channel notification system for todos, subscriptions, and anniversaries.

## Supported Channels
- **Telegram**: Bot-based notifications
- **Webhook**: HTTP POST to custom URL
- **WeCom** (企业微信): Enterprise messaging
- **Feishu** (飞书): Group bot webhook (optional signature)
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
- `sendFeishuWebhookMessage({ webhookUrl, payload, signSecret })`
- `sendEmailMessage({ host, port, secure, user, pass, from, to, subject, text })`

Feishu default payload uses interactive card templates:
- `buildFeishuTestCard()` / `buildFeishuCandidateCard()` in `src/server/notification-senders.ts`
- Optional signature: request body includes `timestamp` (seconds) + `sign` (HMAC-SHA256 + base64) when `signSecret` is configured.
- Card fields (default): item title, offset label, scheduled reminder time, event label/time (due/renew date), time zone, and item path.

## Settings Storage
**Table**: `app_settings`
**Location**: `src/server/db/schema.ts:91-124`

Per-channel configuration:
- `{channel}Enabled`: boolean toggle
- Channel-specific credentials (tokens, URLs, SMTP config)

## API Endpoint
**Location**: `src/app/api/cron/notify/route.ts`

Called by external cron to trigger notification processing.

## Internal Scheduler (Optional)
When self-hosting with a long-running Node server, you can enable in-process scheduled jobs in:
- Settings → 系统内定时任务

Jobs:
- Due notifications (interval)
- Weekly/monthly digests (daily at configured time, idempotent via `digest_deliveries`)

Startup hook: `src/instrumentation.ts` calls `ensureInternalSchedulerStarted()`.

## Digest Reports (Weekly/Monthly)
Digest endpoints send summary + plan messages to **all enabled channels**:
- Weekly: `/api/cron/digest/weekly`
- Monthly: `/api/cron/digest/monthly`

Core files:
- `src/server/digests.ts` - Builds digest content + channel payloads
- `src/server/digest-runner.ts` - Sends digests per channel + logs delivery

Delivery tracking:
- Table `digest_deliveries` (prevents duplicates per channel + period)

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
