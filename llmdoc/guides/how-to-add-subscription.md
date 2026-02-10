# How to Add a New Subscription

## Quick Start
Navigate to `/subscriptions` and click create button.

## Form Fields
1. **Name** (required): Service name (auto-fetches icon)
2. **Category**: 娱乐/工具/学习/办公/其他
3. **Description** (optional)
4. **Price**: Amount in selected currency
5. **Billing Cycle**: Month/Year + interval
6. **Next Renewal Date**: YYYY-MM-DD
7. **Auto Renew**: Toggle for auto vs manual
8. **Reminders**: Days before renewal

## Server Action Flow
1. Form submission
2. `createSubscription()` in `src/app/_actions/subscriptions.ts`
3. `getOrFetchServiceIcon(name)` - fetch/cache icon
4. Insert to `subscriptions` table
5. `revalidatePath("/subscriptions")`

## Renewal Workflow
### Auto Renew Mode
Notification only - date doesn't auto-advance.

### Manual Renew Mode
1. Receive reminder notification
2. Click "Renew" button
3. `renewSubscription()` calculates next date
4. Date advances by cycle interval

## Icon Auto-Fetch
Service name triggers icon lookup:
1. Check `service_icons` cache
2. If missing, fetch from external API
3. Store iconify ID and color

## Key Files
- **Action**: `src/app/_actions/subscriptions.ts:createSubscription`
- **Schema**: `src/lib/validation/subscription.ts`
- **Form**: `src/app/_components/subscriptions/SubscriptionCreateForm.tsx`
- **Icon Fetcher**: `src/server/lib/icon-fetcher.ts`
