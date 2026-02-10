# Coding Conventions

## File Organization
- **Pages**: `src/app/{module}/page.tsx` with `_lib/` for page-specific logic
- **Components**: `src/app/_components/{module}/` for domain components
- **Actions**: `src/app/_actions/{module}.ts` for server actions
- **Lib**: `src/lib/` for shared utilities and type definitions

## Naming Conventions
- **Files**: kebab-case for files (`todo-filters.ts`)
- **Components**: PascalCase (`TodoCard.tsx`)
- **Actions**: camelCase verb + noun (`createTodo`, `updateSubscription`)
- **Types**: PascalCase with suffix (`TodoPriority`, `SubscriptionCycleUnit`)
- **Constants**: SCREAMING_SNAKE_CASE (`TODO_PRIORITY`, `ROUTES`)

## Server Actions Pattern
```typescript
"use server";
import { xxxSchema } from "@/lib/validation/xxx";

export async function createXxx(formData: FormData) {
  const result = xxxSchema.safeParse(formData);
  if (!result.success) redirectWithError(path);
  // ... db operation
  revalidatePath(path);
}
```

## Validation Pattern
- Use Zod schemas in `src/lib/validation/`
- Use `zod-form-data` for FormData parsing
- Export both create and update schemas

## Database Patterns
- All tables have `createdAt`, `updatedAt` timestamps
- Use `deletedAt` for soft delete
- Use `isArchived` + `archivedAt` for archiving
- JSON arrays stored as text: `JSON.stringify(arr)`, `parseNumberArrayJson(str)`

## UI Patterns
- Use semantic color tokens (not hardcoded colors)
- Use `clsx` + `tailwind-merge` for className composition
- Use Framer Motion for animations
- Support dark mode via `next-themes`
