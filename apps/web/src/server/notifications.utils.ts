import "server-only";

import { NOTIFICATION_ITEM_TYPE, type NotificationItemType } from "@/lib/notifications";

export const NOTIFICATION_ITEM_TYPE_LABEL: Record<NotificationItemType, string> = {
  [NOTIFICATION_ITEM_TYPE.TODO]: "Todo",
  [NOTIFICATION_ITEM_TYPE.ANNIVERSARY]: "纪念日",
  [NOTIFICATION_ITEM_TYPE.SUBSCRIPTION]: "订阅",
};

export function isWithinLookbackWindow(
  scheduledAtMs: number,
  lookbackStartMs: number,
  nowMs: number,
): boolean {
  return scheduledAtMs >= lookbackStartMs && scheduledAtMs <= nowMs;
}

export function formatOffsetMinutesLabel(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "到期时";
  if (offsetMinutes === 1) return "提前 1 分钟";
  return `提前 ${offsetMinutes} 分钟`;
}

export function formatOffsetDaysLabel(offsetDays: number): string {
  if (offsetDays === 0) return "当天";
  if (offsetDays === 1) return "提前 1 天";
  return `提前 ${offsetDays} 天`;
}

