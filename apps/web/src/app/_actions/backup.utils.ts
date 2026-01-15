import "server-only";

import { ROUTES } from "@/lib/routes";
import { revalidatePaths } from "./revalidate";

const INSERT_CHUNK_SIZE = 50;

const BACKUP_REVALIDATE_PATHS = [
  ROUTES.home,
  ROUTES.anniversaries,
  ROUTES.subscriptions,
  ROUTES.items,
  ROUTES.dashboard,
  ROUTES.settings,
] as const;

export function revalidateBackupPaths() {
  revalidatePaths(BACKUP_REVALIDATE_PATHS);
}

export function forEachChunk<T>(rows: readonly T[], fn: (chunk: T[]) => void) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    fn(rows.slice(i, i + INSERT_CHUNK_SIZE));
  }
}

export function getRunChanges(result: unknown): number {
  if (!result || typeof result !== "object") return 0;
  const changes = (result as { changes?: unknown }).changes;
  return typeof changes === "number" && Number.isFinite(changes) ? changes : 0;
}
