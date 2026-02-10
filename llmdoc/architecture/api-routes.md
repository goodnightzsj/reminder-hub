# API Routes Architecture

## Overview
Next.js API routes for cron jobs and data export.

## Routes

### POST/GET `/api/cron/notify`
**Location**: `src/app/api/cron/notify/route.ts`

Triggers notification delivery for all enabled channels.

#### Authentication
- `NOTIFY_CRON_SECRET` env variable (optional)
- Methods: `Authorization: Bearer {secret}` or `?token={secret}`
- If no secret configured, all requests allowed

#### Process Flow
1. Check authorization
2. For each channel (telegram, webhook, wecom, email):
   - Call `runNotificationsForChannel(channel)`
   - Handle config errors gracefully
3. Return results summary

#### Response
```json
{
  "ok": true,
  "startedAt": "...",
  "finishedAt": "...",
  "results": [
    { "channel": "telegram", "sent": 2, "failed": 0, "skipped": 0, "status": "ok" },
    { "channel": "webhook", "sent": 0, "failed": 0, "skipped": 0, "status": "skipped_config", "message": "..." }
  ]
}
```

#### Usage
External cron service calls this endpoint periodically (e.g., every 5 minutes).

---

### GET `/api/backup/export`
**Location**: `src/app/api/backup/export/route.ts`

Downloads complete data backup as JSON file.

#### Exported Data
```json
{
  "schemaVersion": 1,
  "exportedAt": "2024-01-01T00:00:00Z",
  "app": {
    "timeZone": "...",
    "dateReminderTime": "..."
  },
  "data": {
    "todos": [...],
    "todoSubtasks": [...],
    "anniversaries": [...],
    "subscriptions": [...],
    "items": [...],
    "notificationDeliveries": [...]
  }
}
```

#### Response Headers
- `Content-Type`: `application/json; charset=utf-8`
- `Content-Disposition`: `attachment; filename="todo-list-backup-{timestamp}.json"`

## Notification Runner
**Location**: `src/server/notification-runner.ts`

Core function: `runNotificationsForChannel(channel)`

1. Get app settings
2. Collect due notification candidates
3. Filter already-sent (by delivery ID)
4. Send via channel-specific sender
5. Log to `notification_deliveries` table

## Key Files
- **Cron Route**: `src/app/api/cron/notify/route.ts`
- **Export Route**: `src/app/api/backup/export/route.ts`
- **Notification Runner**: `src/server/notification-runner.ts`
