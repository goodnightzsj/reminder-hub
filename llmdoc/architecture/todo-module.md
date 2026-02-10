# Todo Module Architecture

## Overview
Full-featured todo management with priorities, categories, subtasks, and recurring tasks.

## Data Model
**Schema**: `src/server/db/schema.ts:34-63` (todos table)
**Schema**: `src/server/db/schema.ts:65-78` (todo_subtasks table)

### Priority Levels
- `low` (低)
- `medium` (中)
- `high` (高)

### Task Types (Categories)
- "个人" (Personal) - default
- "公司" (Company)
- "生活" (Life)

### Filters
- `active`: Not done, not deleted
- `done`: Completed
- `trash`: Soft deleted
- `all`: Everything except deleted

## Server Actions
**Location**: `src/app/_actions/todos.*.ts`

### CRUD Operations (`todos.upsert.ts`)
- `createTodo(formData)` - Create new todo
- `updateTodo(formData)` - Update existing todo

### Lifecycle (`todos.lifecycle.ts`)
- `toggleTodo(formData)` - Toggle completion status
- `deleteTodo(formData)` - Soft/permanent delete
- `restoreTodo(formData)` - Restore from trash
- `setTodoArchived(formData)` - Archive/unarchive

### Subtasks (`todos.subtasks.ts`)
- `createSubtask(formData)` - Add subtask
- `updateSubtask(formData)` - Edit subtask
- `toggleSubtask(formData)` - Toggle subtask completion
- `deleteSubtask(formData)` - Remove subtask

### Ordering (`todos.ordering.ts`)
- `moveTodoUp(formData)` - Move todo up in list
- `moveTodoDown(formData)` - Move todo down
- `reorderTodos(formData)` - Bulk reorder

## UI Components
**Location**: `src/app/_components/todo/`

- `TodoCard.tsx` - Individual todo display
- `TodoCreateForm.tsx` - New todo form
- `SubtaskList.tsx` - Subtask management

## Pages
- `/todo` - List view (`src/app/todo/page.tsx`)
- `/todo/[id]` - Detail/edit view (`src/app/todo/[id]/page.tsx`)

## Reminder System
Todos can have multiple reminder offsets (in minutes before due):
- 0 (at due time)
- 10 (10 minutes before)
- 60 (1 hour before)
- 1440 (1 day before)
- 4320 (3 days before)

**Definition**: `src/lib/todo.ts:66-71`

## Recurrence
Todos support recurrence via:
- `recurrenceRule` - Pattern definition
- `recurrenceRootId` - Original task reference
- `recurrenceNextId` - Next instance in chain

**Utilities**: `src/lib/recurrence.ts`
