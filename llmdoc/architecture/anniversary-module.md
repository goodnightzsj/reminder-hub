# Anniversary Module Architecture

## Overview
Manage anniversaries with solar/lunar calendar support and automatic yearly calculation.

## Data Model
**Schema**: `src/server/db/schema.ts:174-197`

### Date Types
- `solar` - Gregorian calendar (default)
- `lunar` - Chinese lunar calendar

### Categories
- "生日" (Birthday)
- "纪念日" (Anniversary)
- "节日" (Festival)

### Filters
- `active`: Not archived, not deleted
- `archived`: Archived anniversaries
- `trash`: Soft deleted
- `all`: All except deleted

## Server Actions
**Location**: `src/app/_actions/anniversaries.ts`

### Operations
- `createAnniversary(formData)` - Create anniversary
- `updateAnniversary(formData)` - Update anniversary
- `setAnniversaryArchived(formData)` - Archive/unarchive
- `deleteAnniversary(formData)` - Soft/permanent delete
- `restoreAnniversary(formData)` - Restore from trash

## Date Calculation
**Solar**: `src/server/anniversary.ts:getNextSolarOccurrenceDateString`
**Lunar**: `src/server/anniversary.ts:getNextLunarOccurrenceDateString`

### Lunar Calendar
Uses `lunar-javascript` library for lunar/solar conversion.
**Utilities**: `src/lib/lunar-utils.ts`

Key features:
- Leap month support (`isLeapMonth` field)
- Auto-conversion to next occurrence
- Handles lunar month variations

## Date Storage Format
- Solar: `"MM-DD"` (e.g., "03-15")
- Lunar: `"MM-DD"` with lunar interpretation

## UI Components
**Location**: `src/app/_components/anniversary/`

- `AnniversaryCard.tsx` - Anniversary display with countdown
- `AnniversaryCreateForm.tsx` - New anniversary form

## Pages
- `/anniversaries` - List view with upcoming dates
- `/anniversaries/[id]` - Detail/edit view

## Reminder System
Days-based reminders before anniversary:
- Stored as JSON array: `"[0, 1, 7, 30]"`
- Uses `dateReminderTime` from settings for notification time
