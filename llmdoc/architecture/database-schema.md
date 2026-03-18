# Database Schema Architecture

## Overview
SQLite database with 10 tables, managed by Drizzle ORM.

**Connection**: `src/server/db/index.ts:12-25`
**Schema**: `src/server/db/schema.ts`

**Migrations**: `drizzle/*.sql` will be applied automatically on server start by `src/server/db/index.ts`. A file lock (`data/.drizzle-migrate.lock`) avoids concurrent migration runs. Set `SKIP_DB_MIGRATIONS=1` to disable auto-migrate (then run `npm run db:migrate` manually).

## Entity Relationship Diagram
```
todos ──1:N──► todo_subtasks
app_settings (singleton)
subscriptions
anniversaries
items
notification_deliveries
digest_deliveries
service_icons (cache)
brand_metadata (cache)
```

## Core Tables

### todos
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| title | text | Task title |
| description | text? | Optional description |
| taskType | text | Category ("个人", "公司", "生活") |
| priority | text | "low" / "medium" / "high" |
| tags | text | JSON array string |
| dueAt | timestamp_ms? | Due date |
| reminderOffsetsMinutes | text | JSON array of minutes before due |
| recurrenceRule | text? | Recurrence pattern |
| recurrenceRootId | text? | Original recurring task |
| recurrenceNextId | text? | Next instance |
| isDone | boolean | Completion status |
| completedAt | timestamp_ms? | When completed |
| isArchived | boolean | Archive status |
| archivedAt | timestamp_ms? | When archived |
| deletedAt | timestamp_ms? | Soft delete |

### todo_subtasks
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| todoId | text FK→todos | Parent todo |
| title | text | Subtask title |
| isDone | boolean | Completion status |

### subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| name | text | Service name |
| category | text | Category ("娱乐", "工具", etc.) |
| priceCents | integer? | Price in cents |
| currency | text | Currency code |
| cycleUnit | text | "month" / "year" |
| cycleInterval | integer | Billing frequency |
| nextRenewDate | text | YYYY-MM-DD format |
| autoRenew | boolean | Auto-renewal enabled |
| remindOffsetsDays | text | JSON array of days before |
| icon | text? | Iconify ID |
| color | text? | Hex color |

### anniversaries
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| title | text | Anniversary title |
| category | text | "生日" / "纪念日" / "节日" |
| dateType | text | "solar" / "lunar" |
| isLeapMonth | boolean | Lunar leap month |
| date | text | MM-DD or lunar equivalent |
| remindOffsetsDays | text | JSON array of days before |

### items
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| name | text | Item name |
| priceCents | integer? | Purchase price |
| currency | text | Currency code |
| purchasedDate | text? | YYYY-MM-DD |
| category | text? | Category |
| status | text | "using" / "idle" / "retired" |
| usageCount | integer | Times used |
| targetDailyCostCents | integer? | Target daily cost |

### app_settings
Singleton table for app configuration.
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | Fixed ID |
| timeZone | text | User timezone |
| dateReminderTime | text | HH:MM for date-based reminders |
| internalSchedulerEnabled | boolean | In-process scheduler master switch |
| internalNotifyEnabled | boolean | Periodic due-notification runner |
| internalNotifyIntervalSeconds | integer | Notify scan interval (seconds) |
| internalWeeklyDigestEnabled | boolean | Weekly digest (Mon 10:00 by default) |
| internalMonthlyDigestEnabled | boolean | Monthly digest (1st 10:00 by default) |
| internalDigestTime | text | Digest daily run time (HH:MM, app time zone) |
| telegramEnabled | boolean | Telegram notifications |
| telegramBotToken | text? | Bot token |
| telegramChatId | text? | Chat ID |
| webhookEnabled | boolean | Webhook notifications |
| webhookUrl | text? | Webhook URL |
| wecomEnabled | boolean | WeCom notifications |
| wecomWebhookUrl | text? | WeCom URL |
| feishuEnabled | boolean | Feishu notifications |
| feishuWebhookUrl | text? | Feishu Webhook URL |
| feishuSignSecret | text? | Feishu signature secret (optional) |
| emailEnabled | boolean | Email notifications |
| smtp* | text/int | SMTP configuration |

### notification_deliveries
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | channel:itemType:itemId:scheduledAt |
| channel | text | "telegram" / "webhook" / "wecom" / "feishu" / "email" |
| itemType | text | "todo" / "anniversary" / "subscription" |
| itemId | text | Source item ID |
| scheduledAt | timestamp_ms | When to send |
| status | text | "sending" / "sent" / "failed" |
| sentAt | timestamp_ms? | When sent |
| error | text? | Error message |

### digest_deliveries
Tracks weekly/monthly digest delivery status to avoid duplicates.
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | digest:digestType:channel:periodStart |
| digestType | text | "weekly" / "monthly" / "yearly" |
| channel | text | "telegram" / "webhook" / "wecom" / "feishu" / "email" |
| periodStart | text | YYYY-MM-DD |
| periodEnd | text | YYYY-MM-DD |
| status | text | "sending" / "sent" / "failed" |
| sentAt | timestamp_ms? | When sent |
| error | text? | Error message |

## Common Patterns

### Soft Delete
All main entities use `deletedAt` for soft delete:
- First delete: Sets `deletedAt`
- Second delete: Permanent removal

### Archive
Subscriptions and anniversaries use `isArchived` + `archivedAt`.

### Timestamps
All tables have `createdAt` and `updatedAt` with default `unixepoch()*1000`.

### JSON Arrays
Reminder offsets stored as JSON text: `"[0, 10, 60, 1440]"`

## Performance Indexes
**Migration**: `drizzle/0019_add_performance_indexes.sql`

| Table | Index | Column |
|-------|-------|--------|
| todos | idx_todos_deleted_at | deleted_at |
| todos | idx_todos_is_done | is_done |
| todos | idx_todos_due_at | due_at |
| todos | idx_todos_is_archived | is_archived |
| subscriptions | idx_subscriptions_deleted_at | deleted_at |
| subscriptions | idx_subscriptions_next_renew_date | next_renew_date |
| subscriptions | idx_subscriptions_is_archived | is_archived |
| anniversaries | idx_anniversaries_deleted_at | deleted_at |
| anniversaries | idx_anniversaries_date | date |
| anniversaries | idx_anniversaries_is_archived | is_archived |
| items | idx_items_deleted_at | deleted_at |
| items | idx_items_status | status |
| notification_deliveries | idx_notification_deliveries_scheduled_at | scheduled_at |
| notification_deliveries | idx_notification_deliveries_status | status |
| notification_deliveries | idx_notification_deliveries_channel | channel |
| todo_subtasks | idx_todo_subtasks_todo_id | todo_id |
