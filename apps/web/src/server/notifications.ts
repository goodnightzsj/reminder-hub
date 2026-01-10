import { and, eq, isNotNull, isNull } from "drizzle-orm";

import {
  addDaysToDateString,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
import { db } from "@/server/db";
import { anniversaries, subscriptions, todos } from "@/server/db/schema";

export type NotificationChannel = "telegram" | "webhook" | "wecom" | "email";
export type NotificationItemType = "todo" | "anniversary" | "subscription";

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

function parseNumberArrayJson(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
      .filter((v) => v >= 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function formatOffsetMinutesLabel(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "到期时";
  if (offsetMinutes === 1) return "提前 1 分钟";
  return `提前 ${offsetMinutes} 分钟`;
}

function formatOffsetDaysLabel(offsetDays: number): string {
  if (offsetDays === 0) return "当天";
  if (offsetDays === 1) return "提前 1 天";
  return `提前 ${offsetDays} 天`;
}

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

export function buildNotificationDeliveryId(
  channel: NotificationChannel,
  candidate: Pick<NotificationCandidate, "itemType" | "itemId" | "scheduledAt">,
): string {
  return `${channel}:${candidate.itemType}:${candidate.itemId}:${candidate.scheduledAt.getTime()}`;
}

export async function collectDueNotificationCandidates({
  now,
  timeZone,
  dateReminderTime = "09:00",
  lookbackHours = 24,
}: CollectDueCandidatesArgs): Promise<NotificationCandidate[]> {
  const lookbackStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
  const baseDateString = formatDateString(getDatePartsInTimeZone(lookbackStart, timeZone));
  const candidates: NotificationCandidate[] = [];

  const activeTodos = await db
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
        eq(todos.isArchived, false),
        isNull(todos.deletedAt), // Exclude deleted
        isNotNull(todos.dueAt)
      )
    );

  for (const todo of activeTodos) {
    if (!todo.dueAt) continue;
    const offsets = parseNumberArrayJson(todo.reminderOffsetsMinutes);
    if (offsets.length === 0) continue;

    for (const minutes of offsets) {
      const scheduledAt = new Date(todo.dueAt.getTime() - minutes * 60 * 1000);
      if (scheduledAt.getTime() > now.getTime()) continue;
      if (scheduledAt.getTime() < lookbackStart.getTime()) continue;

      candidates.push({
        itemType: "todo",
        itemId: todo.id,
        itemTitle: todo.title,
        scheduledAt,
        offsetLabel: formatOffsetMinutesLabel(minutes),
        eventLabel: "截止",
        eventValue: todo.dueAt.toISOString(),
        eventAt: todo.dueAt,
        path: `/todo/${todo.id}`,
      });
    }
  }

  const activeAnniversaries = await db
    .select()
    .from(anniversaries)
    .where(
      and(
        eq(anniversaries.isArchived, false),
        isNull(anniversaries.deletedAt) // Exclude deleted
      )
    );

  for (const ann of activeAnniversaries) {
    const offsets = parseNumberArrayJson(ann.remindOffsetsDays);
    if (offsets.length === 0) continue;

    const nextDate =
      ann.dateType === "solar"
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
      if (scheduledAt.getTime() > now.getTime()) continue;
      if (scheduledAt.getTime() < lookbackStart.getTime()) continue;

      candidates.push({
        itemType: "anniversary",
        itemId: ann.id,
        itemTitle: ann.title,
        scheduledAt,
        offsetLabel: formatOffsetDaysLabel(days),
        eventLabel: "日期",
        eventValue: nextDate,
        eventAt,
        path: `/anniversaries/${ann.id}`,
      });
    }
  }

  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.isArchived, false),
        isNull(subscriptions.deletedAt) // Exclude deleted
      )
    );

  for (const sub of activeSubscriptions) {
    const offsets = parseNumberArrayJson(sub.remindOffsetsDays);
    if (offsets.length === 0) continue;

    const eventAt = dateTimeLocalToUtcDate(`${sub.nextRenewDate}T${dateReminderTime}`, timeZone);
    if (!eventAt) continue;

    for (const days of offsets) {
      const remindDate = addDaysToDateString(sub.nextRenewDate, -days);
      if (!remindDate) continue;

      const scheduledAt = dateTimeLocalToUtcDate(`${remindDate}T${dateReminderTime}`, timeZone);
      if (!scheduledAt) continue;
      if (scheduledAt.getTime() > now.getTime()) continue;
      if (scheduledAt.getTime() < lookbackStart.getTime()) continue;

      candidates.push({
        itemType: "subscription",
        itemId: sub.id,
        itemTitle: sub.name,
        scheduledAt,
        offsetLabel: formatOffsetDaysLabel(days),
        eventLabel: "到期",
        eventValue: sub.nextRenewDate,
        eventAt,
        path: `/subscriptions/${sub.id}`,
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
  const prefix =
    candidate.itemType === "todo"
      ? "Todo"
      : candidate.itemType === "anniversary"
        ? "纪念日"
        : "订阅";

  return [
    `[${prefix}] ${candidate.itemTitle}`,
    `提醒：${candidate.offsetLabel}（${formatDateTime(candidate.scheduledAt, timeZone)}）`,
    `${candidate.eventLabel}：${formatDateTime(candidate.eventAt, timeZone)}`,
    `路径：${candidate.path}`,
  ].join("\n");
}

export function buildEmailSubject(candidate: NotificationCandidate): string {
  const prefix =
    candidate.itemType === "todo"
      ? "Todo"
      : candidate.itemType === "anniversary"
        ? "纪念日"
        : "订阅";
  return `提醒：${prefix} · ${candidate.itemTitle}`;
}

export function buildWebhookPayload(candidate: NotificationCandidate, timeZone: string) {
  return {
    source: "todo-list",
    channel: "webhook",
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
