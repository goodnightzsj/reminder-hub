# Subscription Module Architecture

## Overview
Track recurring subscriptions with billing cycles, expiration reminders, and renewal management.

## Data Model
**Schema**: `src/server/db/schema.ts:126-153`

### Cycle Units
- `month` - Monthly billing
- `year` - Yearly billing

### Categories
- "其他" (Other) - default
- "娱乐" (Entertainment)
- "工具" (Tools)
- "学习" (Learning)
- "办公" (Office)

### Filters
- `active`: Not archived, not deleted
- `archived`: Archived subscriptions
- `trash`: Soft deleted
- `all`: All except deleted

## Server Actions
**Location**: `src/app/_actions/subscriptions.ts`

### Operations
- `createSubscription(formData)` - Create subscription
- `updateSubscription(formData)` - Update subscription
- `renewSubscription(formData)` - Advance next renewal date
- `setSubscriptionArchived(formData)` - Archive/unarchive
- `deleteSubscription(formData)` - Soft/permanent delete
- `restoreSubscription(formData)` - Restore from trash

## Renewal Logic
**Location**: `src/app/_actions/subscriptions.ts:127-166`

1. Get current `nextRenewDate` and cycle info
2. If past due, use today as base
3. Calculate months to add:
   - Month: `cycleInterval`
   - Year: `cycleInterval * 12`
4. Use `addMonthsClampedToDateString` for date math
5. Update `nextRenewDate`

## Service Icons
Subscriptions auto-fetch icons based on service name.
**Fetcher**: `src/server/lib/icon-fetcher.ts`
**Cache**: `service_icons` table

## UI Components
**Location**: `src/app/_components/subscriptions/`

- `SubscriptionCard.tsx` - Subscription display with status
- `SubscriptionCreateForm.tsx` - New subscription form
- `SubscriptionEditForm.tsx` - Edit form

## Pages
- `/subscriptions` - List view
- `/subscriptions/[id]` - Detail/edit view

## Reminder System
Days-based reminders before renewal:
- Stored as JSON array: `"[0, 1, 7]"` (0 days, 1 day, 7 days before)
- Processed by notification system
