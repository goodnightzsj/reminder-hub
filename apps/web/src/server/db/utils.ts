import "server-only";

import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

/**
 * Standard filter for "Active" items:
 * - Not archived (isArchived = false)
 * - Not soft-deleted (deletedAt is null)
 *
 * Usage:
 * db.select().from(table).where(whereActive(table))
 */
export function whereActive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: SQLiteTableWithColumns<any>
): SQL | undefined {
  // We assume the table has these columns.
  // In a stricter setup, we might enforce a generic type interface,
  // but for Drizzle + SQLite helpers, duck typing via the input table object works well
  // as long as the table definition actually has these columns.
  // Drizzle columns are typed, so if they don't exist, this might throw a TS error at call site
  // or we can cast to `any` inside if needed, but safe typing is better.
  
  // To avoid circular or complex type generic issues, we use `any` for the table type here
  // but rely on Drizzle's runtime column access.
  // The caller must ensure the table has `isArchived` and `deletedAt`.
  return and(eq(table.isArchived, false), isNull(table.deletedAt));
}
