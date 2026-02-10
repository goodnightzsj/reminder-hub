# Backup System Architecture

## Overview
Data import/export functionality for todos, subscriptions, anniversaries, and items.

## Export
**API**: `src/app/api/backup/export/route.ts`

Exports all data as JSON:
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-01T00:00:00Z",
  "todos": [...],
  "subscriptions": [...],
  "anniversaries": [...],
  "items": [...],
  "settings": {...}
}
```

## Import
**Server Actions**: `src/app/_actions/backup.ts`
**Utilities**: `src/app/_actions/backup.utils.ts`, `backup.import.utils.ts`

### Process
1. Parse uploaded JSON file
2. Validate structure
3. Option: Replace all or merge
4. Insert records with new UUIDs
5. Revalidate all paths

## Server Logic
**Location**: `src/server/backup/`

Backup processing utilities:
- Data transformation
- Validation
- Conflict resolution
