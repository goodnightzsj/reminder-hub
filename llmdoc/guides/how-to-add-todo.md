# How to Add a New Todo

## Quick Start
Navigate to `/todo` and click the create button.

## Form Fields
1. **Title** (required): Task name
2. **Description** (optional): Detailed notes
3. **Task Type**: Category selection (个人/公司/生活)
4. **Priority**: Low/Medium/High
5. **Tags**: Comma-separated tags
6. **Due Date**: Optional deadline
7. **Reminders**: Multiple reminder offsets

## Server Action Flow
1. User submits form
2. `createTodo()` in `src/app/_actions/todos.upsert.ts`
3. Zod validation via `todoUpsertSchema`
4. Insert to `todos` table
5. `revalidatePath("/")` (home page)

## Adding Subtasks
After creating a todo:
1. Navigate to `/todo/[id]`
2. Use subtask input field
3. `createSubtask()` action handles insert

## Key Files
- **Action**: `src/app/_actions/todos.upsert.ts:createTodo`
- **Schema**: `src/lib/validation/todo.ts:todoUpsertSchema`
- **Form**: `src/app/_components/todo/TodoCreateForm.tsx`
