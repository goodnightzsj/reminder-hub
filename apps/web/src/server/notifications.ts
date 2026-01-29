import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";

import {
  addDaysToDateString,
  formatDateInTimeZone,
} from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { parseNumberArrayJson } from "@/lib/json";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { ANNIVERSARY_DATE_TYPE } from "@/lib/anniversary";
import { DEFAULT_DATE_REMINDER_TIME } from "@/server/db/app-settings.constants";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
import { db } from "@/server/db";
import { whereActive } from "@/server/db/utils";
import { anniversaries, subscriptions, todos } from "@/server/db/schema";
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ITEM_TYPE,
  isNotificationChannel,
  type NotificationChannel,
  type NotificationItemType,
} from "@/lib/notifications";
import {
  NOTIFICATION_ITEM_TYPE_LABEL,
  formatOffsetDaysLabel,
  formatOffsetMinutesLabel,
  isWithinLookbackWindow,
} from "@/server/notifications.utils";

export { NOTIFICATION_CHANNELS, isNotificationChannel };
export type { NotificationChannel, NotificationItemType };

export type NotificationCandidate = {
  itemType: NotificationItemType;
  itemId: string;
  itemTitle: string;
  scheduledAt: Date;
  offsetLabel: string;
  eventLabel: string;
  eventValue: string;
  eventAt: Date;
  path: string;
};

type CollectDueCandidatesArgs = {
  now: Date;
  timeZone: string;
  dateReminderTime?: string;
  lookbackHours?: number;
};

export function buildNotificationDeliveryId(
  channel: NotificationChannel,
  candidate: Pick<NotificationCandidate, "itemType" | "itemId" | "scheduledAt">,
): string {
  return `${channel}:${candidate.itemType}:${candidate.itemId}:${candidate.scheduledAt.getTime()}`;
}

export async function collectDueNotificationCandidates({
  now,
  timeZone,
  dateReminderTime = DEFAULT_DATE_REMINDER_TIME,
  lookbackHours = 24,
}: CollectDueCandidatesArgs): Promise<NotificationCandidate[]> {
  const lookbackStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
  const nowMs = now.getTime();
  const lookbackStartMs = lookbackStart.getTime();
  const baseDateString = formatDateInTimeZone(lookbackStart, timeZone);
  const candidates: NotificationCandidate[] = [];

  const [activeTodos, activeAnniversaries, activeSubscriptions] = await Promise.all([
    db
      .select({
        id: todos.id,
        title: todos.title,
        dueAt: todos.dueAt,
        reminderOffsetsMinutes: todos.reminderOffsetsMinutes,
      })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, false),
          isNotNull(todos.dueAt),
          whereActive(todos),
        ),
      ),
    db
      .select({
        id: anniversaries.id,
        title: anniversaries.title,
        date: anniversaries.date,
        dateType: anniversaries.dateType,
        isLeapMonth: anniversaries.isLeapMonth,
        remindOffsetsDays: anniversaries.remindOffsetsDays,
      })
      .from(anniversaries)
      .where(whereActive(anniversaries)),
    db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        nextRenewDate: subscriptions.nextRenewDate,
        remindOffsetsDays: subscriptions.remindOffsetsDays,
      })
      .from(subscriptions)
      .where(whereActive(subscriptions)),
  ]);

  for (const todo of activeTodos) {
    if (!todo.dueAt) continue;
    const offsets = parseNumberArrayJson(todo.reminderOffsetsMinutes, { min: 0 });
    if (offsets.length === 0) continue;

    for (const minutes of offsets) {
      const scheduledAt = new Date(todo.dueAt.getTime() - minutes * 60 * 1000);
      if (!isWithinLookbackWindow(scheduledAt.getTime(), lookbackStartMs, nowMs)) continue;

        candidates.push({
          itemType: NOTIFICATION_ITEM_TYPE.TODO,
          itemId: todo.id,
          itemTitle: todo.title,
        scheduledAt,
        offsetLabel: formatOffsetMinutesLabel(minutes),
          eventLabel: "截止",
          eventValue: todo.dueAt.toISOString(),
          eventAt: todo.dueAt,
          path: `${ROUTES.todo}/${todo.id}`,
        });
    }
  }

  for (const ann of activeAnniversaries) {
    const offsets = parseNumberArrayJson(ann.remindOffsetsDays, { min: 0 });
    if (offsets.length === 0) continue;

    const nextDate =
      ann.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
        ? getNextSolarOccurrenceDateString(ann.date, baseDateString)
        : getNextLunarOccurrenceDateString(ann.date, baseDateString, {
            isLeapMonth: ann.isLeapMonth,
          });
    if (!nextDate) continue;

    const eventAt = dateTimeLocalToUtcDate(`${nextDate}T${dateReminderTime}`, timeZone);
    if (!eventAt) continue;

    for (const days of offsets) {
      const remindDate = addDaysToDateString(nextDate, -days);
      if (!remindDate) continue;

      const scheduledAt = dateTimeLocalToUtcDate(`${remindDate}T${dateReminderTime}`, timeZone);
      if (!scheduledAt) continue;
      if (!isWithinLookbackWindow(scheduledAt.getTime(), lookbackStartMs, nowMs)) continue;

        candidates.push({
          itemType: NOTIFICATION_ITEM_TYPE.ANNIVERSARY,
          itemId: ann.id,
          itemTitle: ann.title,
        scheduledAt,
        offsetLabel: formatOffsetDaysLabel(days),
          eventLabel: "日期",
          eventValue: nextDate,
          eventAt,
          path: `${ROUTES.anniversaries}/${ann.id}`,
        });
    }
  }

  for (const sub of activeSubscriptions) {
    const offsets = parseNumberArrayJson(sub.remindOffsetsDays, { min: 0 });
    if (offsets.length === 0) continue;

    const eventAt = dateTimeLocalToUtcDate(`${sub.nextRenewDate}T${dateReminderTime}`, timeZone);
    if (!eventAt) continue;

    for (const days of offsets) {
      const remindDate = addDaysToDateString(sub.nextRenewDate, -days);
      if (!remindDate) continue;

      const scheduledAt = dateTimeLocalToUtcDate(`${remindDate}T${dateReminderTime}`, timeZone);
      if (!scheduledAt) continue;
      if (!isWithinLookbackWindow(scheduledAt.getTime(), lookbackStartMs, nowMs)) continue;

        candidates.push({
          itemType: NOTIFICATION_ITEM_TYPE.SUBSCRIPTION,
          itemId: sub.id,
          itemTitle: sub.name,
        scheduledAt,
        offsetLabel: formatOffsetDaysLabel(days),
          eventLabel: "到期",
          eventValue: sub.nextRenewDate,
          eventAt,
          path: `${ROUTES.subscriptions}/${sub.id}`,
        });
    }
  }

  candidates.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return candidates;
}

export function formatNotificationText(
  candidate: NotificationCandidate,
  timeZone: string,
): string {
  const prefix = NOTIFICATION_ITEM_TYPE_LABEL[candidate.itemType];

  return [
    `[${prefix}] ${candidate.itemTitle}`,
    `提醒：${candidate.offsetLabel}（${formatDateTime(candidate.scheduledAt, timeZone)}）`,
    `${candidate.eventLabel}：${formatDateTime(candidate.eventAt, timeZone)}`,
    `路径：${candidate.path}`,
  ].join("\n");
}

export function buildEmailSubject(candidate: NotificationCandidate): string {
  const prefix = NOTIFICATION_ITEM_TYPE_LABEL[candidate.itemType];
  return `提醒：${prefix} · ${candidate.itemTitle}`;
}

export function buildWebhookPayload(candidate: NotificationCandidate, timeZone: string) {
  return {
    source: "todo-list",
    channel: NOTIFICATION_CHANNEL.WEBHOOK,
    itemType: candidate.itemType,
    itemId: candidate.itemId,
    title: candidate.itemTitle,
    scheduledAt: candidate.scheduledAt.toISOString(),
    offsetLabel: candidate.offsetLabel,
    eventLabel: candidate.eventLabel,
    eventValue: candidate.eventValue,
    eventAt: candidate.eventAt.toISOString(),
    timeZone,
    path: candidate.path,
  };
}
