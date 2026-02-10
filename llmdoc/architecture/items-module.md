# Items Module Architecture

## Overview
Track physical items with usage counting and cost-per-use analysis.

## Data Model
**Schema**: `src/server/db/schema.ts:155-172`

### Status Values
- `using` (使用中) - Currently in use
- `idle` (闲置) - Not being used
- `retired` (淘汰) - No longer used

### Categories
- "其他" (Other) - default
- "数码" (Digital)
- "家居" (Home)
- "衣物" (Clothing)
- "虚拟" (Virtual)
- "运动" (Sports)

### Filters
- `active`: All non-deleted
- `using`: Status = using
- `idle`: Status = idle
- `retired`: Status = retired
- `trash`: Soft deleted
- `all`: Everything

## Cost Analysis
Items track:
- `priceCents`: Purchase price
- `usageCount`: Number of uses
- `targetDailyCostCents`: Target daily cost goal

Cost-per-use = priceCents / usageCount

## Server Actions
**Location**: `src/app/_actions/items.ts`

### Operations
- `createItem(formData)` - Create item
- `updateItem(formData)` - Update item details
- `setItemStatus(formData)` - Change status (using/idle/retired)
- `deleteItem(formData)` - Soft/permanent delete
- `restoreItem(formData)` - Restore from trash

## UI Components
**Location**: `src/app/_components/items/`

- `ItemCard.tsx` - Item display with usage stats
- `ItemCreateForm.tsx` - New item form

## Pages
- `/items` - List view with filtering
- `/items/[id]` - Detail/edit view

## Key Files
- **Action**: `src/app/_actions/items.ts`
- **Schema**: `src/lib/validation/item.ts`
- **Types**: `src/lib/items.ts`
