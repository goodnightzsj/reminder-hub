# Search Module Architecture

## Overview
Global search functionality across todos, anniversaries, subscriptions, and items.

## Page
**Location**: `src/app/search/page.tsx`
**Route**: `/search?q={query}`

## Search Logic
**Location**: `src/app/search/_lib/search-results.ts`

### Query Processing
```typescript
parseSearchQuery(raw) → trimmed string (max 100 chars)
```

### Database Queries
Parallel queries across 4 tables using `LIKE` pattern matching:
1. `todos` - by title
2. `anniversaries` - by title
3. `subscriptions` - by name (with icon join)
4. `items` - by name

**Limit**: 20 results per category

### Query Function
```typescript
querySearchRows(q) → [todoRows, anniversaryRows, subscriptionRows, itemRows]
```

## UI Components
**Location**: `src/app/search/_lib/search-ui.ts`

Utility functions:
- `todoPriorityBadgeConfig` - Priority badge styling
- `getItemStatusBadgeVariant` - Item status badge styling

## Result Display
Results grouped by category with:
- Todo: Priority badge, due date, completion status
- Anniversary: Date type (solar/lunar) badge, date
- Subscription: Service icon, renewal date
- Item: Status badge, purchase date

## URL Structure
Query parameter: `q` (via `SEARCH_QUERY_KEY` from `src/lib/url.ts`)

Example: `/search?q=netflix`

## Key Files
- **Page**: `src/app/search/page.tsx`
- **Logic**: `src/app/search/_lib/search-results.ts`
- **UI Utils**: `src/app/search/_lib/search-ui.ts`
