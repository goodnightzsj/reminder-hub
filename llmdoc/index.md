# Todo-List LLM Documentation Index

> Personal reminder management platform with todos, anniversaries, subscriptions, and multi-channel notifications.

## Quick Reference

| Module | Architecture | Guide |
|--------|-------------|-------|
| Todo | [todo-module.md](architecture/todo-module.md) | [how-to-add-todo.md](guides/how-to-add-todo.md) |
| Subscription | [subscription-module.md](architecture/subscription-module.md) | [how-to-add-subscription.md](guides/how-to-add-subscription.md) |
| Anniversary | [anniversary-module.md](architecture/anniversary-module.md) | [how-to-add-anniversary.md](guides/how-to-add-anniversary.md) |
| Items | [items-module.md](architecture/items-module.md) | - |
| Search | [search-module.md](architecture/search-module.md) | - |
| Settings | [settings-module.md](architecture/settings-module.md) | - |
| Notifications | [notification-system.md](architecture/notification-system.md) | [how-to-add-notification-channels.md](guides/how-to-add-notification-channels.md) |
| Dashboard | [dashboard.md](architecture/dashboard.md) | - |
| Backup | [backup-system.md](architecture/backup-system.md) | - |
| API Routes | [api-routes.md](architecture/api-routes.md) | - |
| Theme | [theme-system.md](architecture/theme-system.md) | - |
| UI Components | [ui-components.md](architecture/ui-components.md) | - |
| Database | [database-schema.md](architecture/database-schema.md) | - |

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript + React 19
- **Database**: SQLite + Drizzle ORM
- **UI**: Tailwind CSS v4
- **Validation**: Zod + zod-form-data

## Key Directories
```
apps/web/src/
├── app/_actions/      # Server actions (mutations)
├── app/_components/   # UI components
├── app/*/             # Page routes
├── lib/               # Shared utilities & types
├── lib/validation/    # Zod schemas
└── server/            # Server-side logic & DB
```

## Documentation

### Overview
- [Project Overview](overview/project-overview.md) - Purpose, features, structure

### Architecture
- [Database Schema](architecture/database-schema.md) - 8 tables, relationships
- [Todo Module](architecture/todo-module.md) - Priorities, subtasks, recurrence
- [Subscription Module](architecture/subscription-module.md) - Billing cycles, renewals
- [Anniversary Module](architecture/anniversary-module.md) - Solar/lunar calendar
- [Items Module](architecture/items-module.md) - Usage tracking, cost analysis
- [Search Module](architecture/search-module.md) - Global search across entities
- [Settings Module](architecture/settings-module.md) - App configuration
- [Notification System](architecture/notification-system.md) - Multi-channel delivery
- [API Routes](architecture/api-routes.md) - Cron & backup endpoints
- [Theme System](architecture/theme-system.md) - Color themes & dark mode
- [UI Components](architecture/ui-components.md) - Reusable components
- [Dashboard](architecture/dashboard.md) - Data aggregation
- [Backup System](architecture/backup-system.md) - Import/export

### Guides
- [How to Add Todo](guides/how-to-add-todo.md)
- [How to Add Subscription](guides/how-to-add-subscription.md)
- [How to Add Anniversary](guides/how-to-add-anniversary.md)
- [How to Add Notification Channels](guides/how-to-add-notification-channels.md)

### Reference
- [Coding Conventions](reference/coding-conventions.md)
- [Git Conventions](reference/git-conventions.md)

## Common Patterns

### Server Actions
All mutations in `_actions/` use:
```
"use server" → Zod validation → DB operation → revalidatePath
```

### Soft Delete
First delete sets `deletedAt`, second delete is permanent.

### Reminders
- Todos: Minutes before (`reminderOffsetsMinutes`)
- Subscriptions/Anniversaries: Days before (`remindOffsetsDays`)
