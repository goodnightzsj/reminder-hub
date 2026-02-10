# Dashboard Architecture

## Overview
Aggregated view of todos, subscriptions, and anniversaries with insights and statistics.

## Data Aggregation
**Location**: `src/app/dashboard/_lib/dashboard-page-data.ts`

Collects:
- Today's pending todos (sorted by priority)
- Upcoming subscription renewals
- Upcoming anniversaries
- Spending statistics

## Components
**Location**: `src/app/dashboard/_components/`

### TodayFocusCard (`TodayFocusCard.tsx`)
Displays today's priority tasks:
- High priority items first
- Due time display
- Quick completion toggle

### InsightsCard (`InsightsCard.tsx`)
Statistics and insights:
- Task completion rate
- Upcoming deadlines
- Subscription costs

### SpendBarChart (`SpendBarChart.tsx`)
Subscription spending visualization:
- Monthly breakdown
- Category grouping

## Utilities
**Location**: `src/app/dashboard/_lib/dashboard-utils.ts`

Helper functions for:
- Date range calculations
- Spending aggregation
- Priority sorting
- Due date formatting

## Data Flow
```
page.tsx
  ↓
getDashboardData()
  ├── getTodayTodos()
  ├── getUpcomingSubscriptions()
  ├── getUpcomingAnniversaries()
  └── getSpendingStats()
  ↓
Dashboard Components
```

## Page
**Location**: `src/app/dashboard/page.tsx`

Server component that:
1. Fetches aggregated data
2. Renders card grid
3. Responsive layout (mobile/desktop)
