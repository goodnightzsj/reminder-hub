# Settings Module Architecture

## Overview
Central configuration page for app appearance, notifications, backup, and data management.

## Page
**Location**: `src/app/settings/page.tsx`
**Route**: `/settings`

## Sections

### 1. Appearance Theme
**Component**: `ThemeSwitcher`

Allows switching between 8 color themes:
- Ocean Blue (信任蓝) - default
- Emerald (翡翠绿)
- Notion Gray (棕橙)
- Todoist Zeus (橄榄绿)
- TickTick Teal (青蓝)
- Fintech Gold (金色)
- Peach Fuzz (蜜桃)
- Aurora (极光) - gradient

### 2. Date Reminder Time
**Component**: `DateReminderForm`

Sets default notification time for date-based reminders (anniversaries, subscriptions).
- Stored in `app_settings.dateReminderTime`
- Format: `HH:MM`

### 3. Notification Channels
**Component**: `NotificationSettingsSection`

Configures 4 notification channels:
- Telegram (bot token, chat ID)
- Webhook (URL)
- WeCom (webhook URL)
- Email (SMTP settings)

### 4. Backup & Restore
Two import modes:
- **Overwrite**: Clears all data, imports backup
- **Merge**: Adds new records, skips existing IDs

Export via `/api/backup/export`

### 5. Danger Zone
**Action**: `clearAllData`

Permanently deletes all data (todos, anniversaries, subscriptions, items, notifications).

## Server Actions
**Location**: `src/app/_actions/settings.ts`

- `clearAllData()` - Delete all user data

**Location**: `src/app/_actions/backup.ts`

- `importBackupOverwrite(formData)` - Overwrite import
- `importBackupMerge(formData)` - Merge import

## Key Files
- **Page**: `src/app/settings/page.tsx`
- **Theme Switcher**: `src/app/_components/ThemeSwitcher.tsx`
- **Date Reminder Form**: `src/app/_components/settings/DateReminderForm.tsx`
- **Notification Section**: `src/app/_components/settings/NotificationSettingsSection.tsx`
