import "server-only";

import { diffDays } from "@/server/date";

export function computeDaysUsed(purchasedDate: string | null, today: string): number | null {
  if (!purchasedDate) return null;
  const diff = diffDays(purchasedDate, today);
  if (diff === null) return null;
  if (diff < 0) return null;
  return diff + 1;
}
