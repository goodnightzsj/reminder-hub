# Project Overview

## Purpose
A modern personal reminder management platform integrating todo management, anniversaries, subscription tracking, and item tracking with multi-channel notification support.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Webpack build)
- **Language**: TypeScript + React 19
- **Database**: SQLite (better-sqlite3 runtime)
- **ORM**: Drizzle ORM + drizzle-kit migrations
- **UI**: Tailwind CSS v4 + semantic color tokens
- **Validation**: Zod + zod-form-data

## Core Features
1. **Todo Management**: Priority/category/tags filtering, deadlines with reminders, subtasks, recurrence
2. **Anniversaries**: Solar/lunar calendar support, yearly repetition, advance reminders
3. **Subscriptions**: Monthly/yearly billing cycles, expiration reminders, manual/auto renewal
4. **Dashboard**: Aggregated today tasks, upcoming subscriptions, anniversaries
5. **Notifications**: Multi-channel (Telegram, Webhook, WeCom, Feishu, Email)
6. **Reports**: Weekly/monthly digests + annual review pages (`/review` for year picker, `/review/{year}` for KPI/节奏/分类统计/完成详情)

## Project Structure
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── _actions/           # Server actions (CRUD operations)
│   │   ├── _components/        # Shared UI components
│   │   ├── todo/               # Todo pages
│   │   ├── subscriptions/      # Subscription pages
│   │   ├── anniversaries/      # Anniversary pages
│   │   ├── items/              # Items pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── search/             # Search pages
│   │   ├── settings/           # Settings pages
│   │   ├── review/             # Annual review pages
│   │   └── api/                # API routes (cron, backup)
│   ├── lib/                    # Shared utilities & type definitions
│   │   └── validation/         # Zod schemas
│   └── server/                 # Server-side logic
│       ├── db/                 # Database schema & connection
│       ├── lib/                # Server utilities
│       └── backup/             # Backup logic
└── drizzle/                    # Database migrations
```

## Key Patterns
- **Server Actions**: All mutations use `"use server"` with Zod validation
- **Soft Delete**: Records have `deletedAt` field, second delete = permanent
- **Archive**: Separate `isArchived` + `archivedAt` for archiving
- **Path Revalidation**: Uses `revalidatePath` after mutations
- **Flash Messages**: Query param based toast notifications (`?action=updated`)
