import "server-only";

import { and, asc, desc, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";

import { ANNIVERSARY_DATE_TYPE, type AnniversaryDateType } from "@/lib/anniversary";
import { formatDateTime } from "@/lib/format";
import { DIGEST_TYPE, type DigestType } from "@/lib/digests";
import { NOTIFICATION_CHANNEL, type NotificationChannel } from "@/lib/notifications";

import { getNextLunarOccurrenceDateString, getNextSolarOccurrenceDateString } from "@/server/anniversary";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { getMonthlyDigestPeriods, getWeeklyDigestPeriods, type DigestPeriod } from "@/server/digest-periods";

type AnniversaryRow = {
  id: string;
  title: string;
  dateType: AnniversaryDateType;
  isLeapMonth: boolean;
  date: string;
};

type AnniversaryOccurrence = {
  id: string;
  title: string;
  dateType: AnniversaryDateType;
  occurrenceDate: string; // YYYY-MM-DD (solar date)
};

function buildAnniversaryOccurrencesInRange(
  rows: AnniversaryRow[],
  range: { startDate: string; endDate: string },
): AnniversaryOccurrence[] {
  const results: AnniversaryOccurrence[] = [];

  for (const ann of rows) {
    const nextDate =
      ann.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
        ? getNextSolarOccurrenceDateString(ann.date, range.startDate)
        : getNextLunarOccurrenceDateString(ann.date, range.startDate, {
            isLeapMonth: ann.isLeapMonth,
          });

    if (!nextDate) continue;
    if (nextDate < range.startDate || nextDate > range.endDate) continue;

    results.push({
      id: ann.id,
      title: ann.title,
      dateType: ann.dateType,
      occurrenceDate: nextDate,
    });
  }

  results.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.title.localeCompare(b.title, "zh-CN"));
  return results;
}

function capList<T>(items: T[], max: number): { visible: T[]; hiddenCount: number } {
  if (items.length <= max) return { visible: items, hiddenCount: 0 };
  return { visible: items.slice(0, max), hiddenCount: items.length - max };
}

function formatListWithOverflow(items: string[], max: number): string[] {
  const { visible, hiddenCount } = capList(items, max);
  if (hiddenCount <= 0) return visible;
  return [...visible, `…等 ${hiddenCount} 条`];
}

export type DigestSection = {
  title: string;
  lines: string[];
};

export type DigestMessage = {
  type: DigestType;
  title: string;
  timeZone: string;
  generatedAtIso: string;
  sections: DigestSection[];
};

export type DigestSendInput = {
  channel: NotificationChannel;
  message: DigestMessage;
};

export function buildDigestDeliveryId(args: { digestType: DigestType; channel: NotificationChannel; periodStart: string }): string {
  return `digest:${args.digestType}:${args.channel}:${args.periodStart}`;
}

function buildWeeklyDigestMessage(args: {
  periods: { lastWeek: DigestPeriod; thisWeek: DigestPeriod };
  timeZone: string;
  now: Date;
  todosCompletedLastWeek: Array<{ title: string; completedAt: Date }>;
  todosCreatedLastWeek: Array<{ title: string; createdAt: Date }>;
  overdueTodos: Array<{ title: string; dueAt: Date }>;
  dueTodosThisWeek: Array<{ title: string; dueAt: Date }>;
  anniversariesLastWeek: AnniversaryOccurrence[];
  anniversariesThisWeek: AnniversaryOccurrence[];
  overdueSubscriptions: Array<{ name: string; nextRenewDate: string; autoRenew: boolean }>;
  dueSubscriptionsThisWeek: Array<{ name: string; nextRenewDate: string; autoRenew: boolean }>;
  newItemsLastWeek: Array<{ name: string; createdAt: Date }>;
}): DigestMessage {
  const { lastWeek, thisWeek } = args.periods;

  const completedTodoLines = formatListWithOverflow(
    args.todosCompletedLastWeek.map((t) => `- ${t.title}（${formatDateTime(t.completedAt, args.timeZone)}）`),
    8,
  );
  const createdTodoLines = formatListWithOverflow(
    args.todosCreatedLastWeek.map((t) => `- ${t.title}（${formatDateTime(t.createdAt, args.timeZone)}）`),
    8,
  );
  const overdueTodoLines = formatListWithOverflow(
    args.overdueTodos.map((t) => `- ${t.title}（截止 ${formatDateTime(t.dueAt, args.timeZone)}）`),
    6,
  );
  const dueTodoLines = formatListWithOverflow(
    args.dueTodosThisWeek.map((t) => `- ${t.title}（截止 ${formatDateTime(t.dueAt, args.timeZone)}）`),
    8,
  );

  const lastWeekAnnLines = formatListWithOverflow(
    args.anniversariesLastWeek.map((a) => `- ${a.occurrenceDate} · ${a.title}`),
    8,
  );
  const thisWeekAnnLines = formatListWithOverflow(
    args.anniversariesThisWeek.map((a) => `- ${a.occurrenceDate} · ${a.title}`),
    8,
  );

  const overdueSubLines = formatListWithOverflow(
    args.overdueSubscriptions.map(
      (s) => `- ${s.nextRenewDate} · ${s.name}${s.autoRenew ? "（自动续费）" : ""}`,
    ),
    8,
  );
  const dueSubLines = formatListWithOverflow(
    args.dueSubscriptionsThisWeek.map(
      (s) => `- ${s.nextRenewDate} · ${s.name}${s.autoRenew ? "（自动续费）" : ""}`,
    ),
    8,
  );

  const newItemLines = formatListWithOverflow(
    args.newItemsLastWeek.map((it) => `- ${it.name}（${formatDateTime(it.createdAt, args.timeZone)}）`),
    8,
  );

  const summaryLines = [
    `上周：${lastWeek.startDate} ~ ${lastWeek.endDate}`,
    `本周：${thisWeek.startDate} ~ ${thisWeek.endDate}`,
    "",
    `完成 Todo：${args.todosCompletedLastWeek.length}｜新增 Todo：${args.todosCreatedLastWeek.length}｜逾期 Todo：${args.overdueTodos.length}`,
    `经过纪念日：${args.anniversariesLastWeek.length}｜本周纪念日：${args.anniversariesThisWeek.length}`,
    `已到期订阅：${args.overdueSubscriptions.length}｜本周到期订阅：${args.dueSubscriptionsThisWeek.length}`,
    `新增物品：${args.newItemsLastWeek.length}`,
  ];

  const sections: DigestSection[] = [
    {
      title: "概览",
      lines: summaryLines,
    },
    {
      title: "上周总结",
      lines: [
        `完成 Todo（${args.todosCompletedLastWeek.length}）`,
        ...(completedTodoLines.length ? completedTodoLines : ["- （无）"]),
        "",
        `新增 Todo（${args.todosCreatedLastWeek.length}）`,
        ...(createdTodoLines.length ? createdTodoLines : ["- （无）"]),
        "",
        `经过纪念日（${args.anniversariesLastWeek.length}）`,
        ...(lastWeekAnnLines.length ? lastWeekAnnLines : ["- （无）"]),
        "",
        `已到期订阅（${args.overdueSubscriptions.length}）`,
        ...(overdueSubLines.length ? overdueSubLines : ["- （无）"]),
        "",
        `新增物品（${args.newItemsLastWeek.length}）`,
        ...(newItemLines.length ? newItemLines : ["- （无）"]),
      ],
    },
    {
      title: "本周计划",
      lines: [
        `逾期 Todo（${args.overdueTodos.length}）`,
        ...(overdueTodoLines.length ? overdueTodoLines : ["- （无）"]),
        "",
        `本周截止 Todo（${args.dueTodosThisWeek.length}）`,
        ...(dueTodoLines.length ? dueTodoLines : ["- （无）"]),
        "",
        `本周纪念日（${args.anniversariesThisWeek.length}）`,
        ...(thisWeekAnnLines.length ? thisWeekAnnLines : ["- （无）"]),
        "",
        `本周到期订阅（${args.dueSubscriptionsThisWeek.length}）`,
        ...(dueSubLines.length ? dueSubLines : ["- （无）"]),
      ],
    },
  ];

  return {
    type: DIGEST_TYPE.WEEKLY,
    title: `周报（上周总结 + 本周计划）`,
    timeZone: args.timeZone,
    generatedAtIso: args.now.toISOString(),
    sections,
  };
}

function buildMonthlyDigestMessage(args: {
  periods: { lastMonth: DigestPeriod; thisMonth: DigestPeriod };
  timeZone: string;
  now: Date;
  todosCompletedLastMonth: Array<{ title: string; completedAt: Date }>;
  todosCreatedLastMonth: Array<{ title: string; createdAt: Date }>;
  overdueTodos: Array<{ title: string; dueAt: Date }>;
  dueTodosThisMonth: Array<{ title: string; dueAt: Date }>;
  anniversariesLastMonth: AnniversaryOccurrence[];
  anniversariesThisMonth: AnniversaryOccurrence[];
  overdueSubscriptions: Array<{ name: string; nextRenewDate: string; autoRenew: boolean }>;
  dueSubscriptionsThisMonth: Array<{ name: string; nextRenewDate: string; autoRenew: boolean }>;
  newItemsLastMonth: Array<{ name: string; createdAt: Date }>;
}): DigestMessage {
  const { lastMonth, thisMonth } = args.periods;

  const completedTodoLines = formatListWithOverflow(
    args.todosCompletedLastMonth.map((t) => `- ${t.title}（${formatDateTime(t.completedAt, args.timeZone)}）`),
    10,
  );
  const createdTodoLines = formatListWithOverflow(
    args.todosCreatedLastMonth.map((t) => `- ${t.title}（${formatDateTime(t.createdAt, args.timeZone)}）`),
    10,
  );
  const overdueTodoLines = formatListWithOverflow(
    args.overdueTodos.map((t) => `- ${t.title}（截止 ${formatDateTime(t.dueAt, args.timeZone)}）`),
    8,
  );
  const dueTodoLines = formatListWithOverflow(
    args.dueTodosThisMonth.map((t) => `- ${t.title}（截止 ${formatDateTime(t.dueAt, args.timeZone)}）`),
    12,
  );

  const lastMonthAnnLines = formatListWithOverflow(
    args.anniversariesLastMonth.map((a) => `- ${a.occurrenceDate} · ${a.title}`),
    10,
  );
  const thisMonthAnnLines = formatListWithOverflow(
    args.anniversariesThisMonth.map((a) => `- ${a.occurrenceDate} · ${a.title}`),
    10,
  );

  const overdueSubLines = formatListWithOverflow(
    args.overdueSubscriptions.map(
      (s) => `- ${s.nextRenewDate} · ${s.name}${s.autoRenew ? "（自动续费）" : ""}`,
    ),
    12,
  );
  const dueSubLines = formatListWithOverflow(
    args.dueSubscriptionsThisMonth.map(
      (s) => `- ${s.nextRenewDate} · ${s.name}${s.autoRenew ? "（自动续费）" : ""}`,
    ),
    12,
  );

  const newItemLines = formatListWithOverflow(
    args.newItemsLastMonth.map((it) => `- ${it.name}（${formatDateTime(it.createdAt, args.timeZone)}）`),
    10,
  );

  const summaryLines = [
    `上月：${lastMonth.startDate} ~ ${lastMonth.endDate}`,
    `本月：${thisMonth.startDate} ~ ${thisMonth.endDate}`,
    "",
    `完成 Todo：${args.todosCompletedLastMonth.length}｜新增 Todo：${args.todosCreatedLastMonth.length}｜逾期 Todo：${args.overdueTodos.length}`,
    `经过纪念日：${args.anniversariesLastMonth.length}｜本月纪念日：${args.anniversariesThisMonth.length}`,
    `已到期订阅：${args.overdueSubscriptions.length}｜本月到期订阅：${args.dueSubscriptionsThisMonth.length}`,
    `新增物品：${args.newItemsLastMonth.length}`,
  ];

  const sections: DigestSection[] = [
    { title: "概览", lines: summaryLines },
    {
      title: "上月总结",
      lines: [
        `完成 Todo（${args.todosCompletedLastMonth.length}）`,
        ...(completedTodoLines.length ? completedTodoLines : ["- （无）"]),
        "",
        `新增 Todo（${args.todosCreatedLastMonth.length}）`,
        ...(createdTodoLines.length ? createdTodoLines : ["- （无）"]),
        "",
        `经过纪念日（${args.anniversariesLastMonth.length}）`,
        ...(lastMonthAnnLines.length ? lastMonthAnnLines : ["- （无）"]),
        "",
        `已到期订阅（${args.overdueSubscriptions.length}）`,
        ...(overdueSubLines.length ? overdueSubLines : ["- （无）"]),
        "",
        `新增物品（${args.newItemsLastMonth.length}）`,
        ...(newItemLines.length ? newItemLines : ["- （无）"]),
      ],
    },
    {
      title: "本月计划",
      lines: [
        `逾期 Todo（${args.overdueTodos.length}）`,
        ...(overdueTodoLines.length ? overdueTodoLines : ["- （无）"]),
        "",
        `本月截止 Todo（${args.dueTodosThisMonth.length}）`,
        ...(dueTodoLines.length ? dueTodoLines : ["- （无）"]),
        "",
        `本月纪念日（${args.anniversariesThisMonth.length}）`,
        ...(thisMonthAnnLines.length ? thisMonthAnnLines : ["- （无）"]),
        "",
        `本月到期订阅（${args.dueSubscriptionsThisMonth.length}）`,
        ...(dueSubLines.length ? dueSubLines : ["- （无）"]),
      ],
    },
  ];

  return {
    type: DIGEST_TYPE.MONTHLY,
    title: `月报（上月总结 + 本月计划）`,
    timeZone: args.timeZone,
    generatedAtIso: args.now.toISOString(),
    sections,
  };
}

export function formatDigestText(message: DigestMessage): string {
  const lines: string[] = [];

  lines.push(message.title);
  lines.push(`生成时间：${message.generatedAtIso}`);
  lines.push(`时区：${message.timeZone}`);

  for (const section of message.sections) {
    lines.push("");
    lines.push(`【${section.title}】`);
    for (const line of section.lines) lines.push(line);
  }

  return lines.join("\n");
}

export function buildFeishuDigestCard(message: DigestMessage): Record<string, unknown> {
  const elements: Array<Record<string, unknown>> = [];

  for (const section of message.sections) {
    const content = [`**${section.title}**`, "", ...section.lines].join("\n");
    elements.push({ tag: "div", text: { tag: "lark_md", content } });
    elements.push({ tag: "hr" });
  }

  // Remove trailing hr for cleaner look
  if (elements.length > 0) elements.pop();

  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true, enable_forward: true },
      header: {
        template: "blue",
        title: { tag: "plain_text", content: message.title },
      },
      elements,
    },
  };
}

export function buildDigestWebhookPayload(args: { message: DigestMessage; channel: NotificationChannel }): Record<string, unknown> {
  return {
    source: "todo-list",
    channel: args.channel,
    type: `digest.${args.message.type}`,
    title: args.message.title,
    generatedAt: args.message.generatedAtIso,
    timeZone: args.message.timeZone,
    sections: args.message.sections,
  };
}

export function buildDigestEmailSubject(message: DigestMessage): string {
  const prefix = message.type === DIGEST_TYPE.WEEKLY ? "周报" : message.type === DIGEST_TYPE.MONTHLY ? "月报" : "汇总";
  return `${prefix}（todo-list）`;
}

type AppSettings = Awaited<ReturnType<typeof getAppSettings>>;

export async function buildWeeklyDigestFromSettings(
  settings: AppSettings,
  now: Date = new Date(),
): Promise<{ message: DigestMessage; period: { start: string; end: string } }> {
  const periods = getWeeklyDigestPeriods(now, settings.timeZone);

  const startUtc = periods.lastWeek.startUtc;
  const endExclusiveUtc = periods.lastWeek.endExclusiveUtc;

  const thisWeekStartUtc = periods.thisWeek.startUtc;
  const thisWeekEndExclusiveUtc = periods.thisWeek.endExclusiveUtc;

  const [
    todosCompletedLastWeek,
    todosCreatedLastWeek,
    overdueTodos,
    dueTodosThisWeek,
    anniversaryRows,
    subscriptionRows,
    newItemsLastWeek,
  ] = await Promise.all([
    db
      .select({ title: todos.title, completedAt: todos.completedAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.completedAt))
      .limit(50),
    db
      .select({ title: todos.title, createdAt: todos.createdAt })
      .from(todos)
      .where(
        and(
          gte(todos.createdAt, startUtc),
          lt(todos.createdAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.createdAt))
      .limit(50),
    db
      .select({ title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, false),
          eq(todos.isArchived, false),
          isNotNull(todos.dueAt),
          lt(todos.dueAt, thisWeekStartUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(asc(todos.dueAt))
      .limit(50),
    db
      .select({ title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, false),
          eq(todos.isArchived, false),
          isNotNull(todos.dueAt),
          gte(todos.dueAt, thisWeekStartUtc),
          lt(todos.dueAt, thisWeekEndExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(asc(todos.dueAt))
      .limit(80),
    db
      .select({
        id: anniversaries.id,
        title: anniversaries.title,
        dateType: anniversaries.dateType,
        isLeapMonth: anniversaries.isLeapMonth,
        date: anniversaries.date,
      })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .orderBy(desc(anniversaries.createdAt)),
    db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        nextRenewDate: subscriptions.nextRenewDate,
        autoRenew: subscriptions.autoRenew,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .orderBy(asc(subscriptions.nextRenewDate)),
    db
      .select({ name: items.name, createdAt: items.createdAt })
      .from(items)
      .where(
        and(
          gte(items.createdAt, startUtc),
          lt(items.createdAt, endExclusiveUtc),
          isNull(items.deletedAt),
        ),
      )
      .orderBy(desc(items.createdAt))
      .limit(50),
  ]);

  const anniversariesLastWeek = buildAnniversaryOccurrencesInRange(anniversaryRows, {
    startDate: periods.lastWeek.startDate,
    endDate: periods.lastWeek.endDate,
  });
  const anniversariesThisWeek = buildAnniversaryOccurrencesInRange(anniversaryRows, {
    startDate: periods.thisWeek.startDate,
    endDate: periods.thisWeek.endDate,
  });

  const overdueSubscriptions = subscriptionRows.filter((s) => s.nextRenewDate < periods.thisWeek.startDate);
  const dueSubscriptionsThisWeek = subscriptionRows.filter(
    (s) => s.nextRenewDate >= periods.thisWeek.startDate && s.nextRenewDate <= periods.thisWeek.endDate,
  );

  const message = buildWeeklyDigestMessage({
    periods,
    timeZone: settings.timeZone,
    now,
    todosCompletedLastWeek: todosCompletedLastWeek
      .map((t) => (t.completedAt ? { title: t.title, completedAt: t.completedAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    todosCreatedLastWeek: todosCreatedLastWeek
      .map((t) => (t.createdAt ? { title: t.title, createdAt: t.createdAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    overdueTodos: overdueTodos
      .map((t) => (t.dueAt ? { title: t.title, dueAt: t.dueAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    dueTodosThisWeek: dueTodosThisWeek
      .map((t) => (t.dueAt ? { title: t.title, dueAt: t.dueAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    anniversariesLastWeek,
    anniversariesThisWeek,
    overdueSubscriptions: overdueSubscriptions.map((s) => ({
      name: s.name,
      nextRenewDate: s.nextRenewDate,
      autoRenew: !!s.autoRenew,
    })),
    dueSubscriptionsThisWeek: dueSubscriptionsThisWeek.map((s) => ({
      name: s.name,
      nextRenewDate: s.nextRenewDate,
      autoRenew: !!s.autoRenew,
    })),
    newItemsLastWeek: newItemsLastWeek
      .map((it) => (it.createdAt ? { name: it.name, createdAt: it.createdAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
  });

  return {
    message,
    period: { start: periods.lastWeek.startDate, end: periods.lastWeek.endDate },
  };
}

export async function buildMonthlyDigestFromSettings(
  settings: AppSettings,
  now: Date = new Date(),
): Promise<{ message: DigestMessage; period: { start: string; end: string } }> {
  const periods = getMonthlyDigestPeriods(now, settings.timeZone);

  const startUtc = periods.lastMonth.startUtc;
  const endExclusiveUtc = periods.lastMonth.endExclusiveUtc;

  const thisMonthStartUtc = periods.thisMonth.startUtc;
  const thisMonthEndExclusiveUtc = periods.thisMonth.endExclusiveUtc;

  const [
    todosCompletedLastMonth,
    todosCreatedLastMonth,
    overdueTodos,
    dueTodosThisMonth,
    anniversaryRows,
    subscriptionRows,
    newItemsLastMonth,
  ] = await Promise.all([
    db
      .select({ title: todos.title, completedAt: todos.completedAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.completedAt))
      .limit(200),
    db
      .select({ title: todos.title, createdAt: todos.createdAt })
      .from(todos)
      .where(
        and(
          gte(todos.createdAt, startUtc),
          lt(todos.createdAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.createdAt))
      .limit(200),
    db
      .select({ title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, false),
          eq(todos.isArchived, false),
          isNotNull(todos.dueAt),
          lt(todos.dueAt, thisMonthStartUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(asc(todos.dueAt))
      .limit(200),
    db
      .select({ title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, false),
          eq(todos.isArchived, false),
          isNotNull(todos.dueAt),
          gte(todos.dueAt, thisMonthStartUtc),
          lt(todos.dueAt, thisMonthEndExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(asc(todos.dueAt))
      .limit(400),
    db
      .select({
        id: anniversaries.id,
        title: anniversaries.title,
        dateType: anniversaries.dateType,
        isLeapMonth: anniversaries.isLeapMonth,
        date: anniversaries.date,
      })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .orderBy(desc(anniversaries.createdAt)),
    db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        nextRenewDate: subscriptions.nextRenewDate,
        autoRenew: subscriptions.autoRenew,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .orderBy(asc(subscriptions.nextRenewDate)),
    db
      .select({ name: items.name, createdAt: items.createdAt })
      .from(items)
      .where(
        and(
          gte(items.createdAt, startUtc),
          lt(items.createdAt, endExclusiveUtc),
          isNull(items.deletedAt),
        ),
      )
      .orderBy(desc(items.createdAt))
      .limit(200),
  ]);

  const anniversariesLastMonth = buildAnniversaryOccurrencesInRange(anniversaryRows, {
    startDate: periods.lastMonth.startDate,
    endDate: periods.lastMonth.endDate,
  });
  const anniversariesThisMonth = buildAnniversaryOccurrencesInRange(anniversaryRows, {
    startDate: periods.thisMonth.startDate,
    endDate: periods.thisMonth.endDate,
  });

  const overdueSubscriptions = subscriptionRows.filter((s) => s.nextRenewDate < periods.thisMonth.startDate);
  const dueSubscriptionsThisMonth = subscriptionRows.filter(
    (s) => s.nextRenewDate >= periods.thisMonth.startDate && s.nextRenewDate <= periods.thisMonth.endDate,
  );

  const message = buildMonthlyDigestMessage({
    periods,
    timeZone: settings.timeZone,
    now,
    todosCompletedLastMonth: todosCompletedLastMonth
      .map((t) => (t.completedAt ? { title: t.title, completedAt: t.completedAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    todosCreatedLastMonth: todosCreatedLastMonth
      .map((t) => (t.createdAt ? { title: t.title, createdAt: t.createdAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    overdueTodos: overdueTodos
      .map((t) => (t.dueAt ? { title: t.title, dueAt: t.dueAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    dueTodosThisMonth: dueTodosThisMonth
      .map((t) => (t.dueAt ? { title: t.title, dueAt: t.dueAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
    anniversariesLastMonth,
    anniversariesThisMonth,
    overdueSubscriptions: overdueSubscriptions.map((s) => ({
      name: s.name,
      nextRenewDate: s.nextRenewDate,
      autoRenew: !!s.autoRenew,
    })),
    dueSubscriptionsThisMonth: dueSubscriptionsThisMonth.map((s) => ({
      name: s.name,
      nextRenewDate: s.nextRenewDate,
      autoRenew: !!s.autoRenew,
    })),
    newItemsLastMonth: newItemsLastMonth
      .map((it) => (it.createdAt ? { name: it.name, createdAt: it.createdAt } : null))
      .filter((v): v is NonNullable<typeof v> => v !== null),
  });

  return {
    message,
    period: { start: periods.lastMonth.startDate, end: periods.lastMonth.endDate },
  };
}

export function buildDigestDeliveryPeriodStart(args: { digestType: DigestType; now: Date; timeZone: string }): string {
  if (args.digestType === DIGEST_TYPE.WEEKLY) {
    return getWeeklyDigestPeriods(args.now, args.timeZone).lastWeek.startDate;
  }
  if (args.digestType === DIGEST_TYPE.MONTHLY) {
    return getMonthlyDigestPeriods(args.now, args.timeZone).lastMonth.startDate;
  }
  return args.now.toISOString().slice(0, 10);
}

export function buildDigestScheduledAt(args: { digestType: DigestType; periodStart: string; timeZone: string }): Date | null {
  const timeOfDay = "10:00";
  return dateTimeLocalToUtcDate(`${args.periodStart}T${timeOfDay}`, args.timeZone);
}

export function isDigestChannelEnabled(settings: Awaited<ReturnType<typeof getAppSettings>>, channel: NotificationChannel): boolean {
  if (channel === NOTIFICATION_CHANNEL.TELEGRAM) return !!settings.telegramEnabled;
  if (channel === NOTIFICATION_CHANNEL.WEBHOOK) return !!settings.webhookEnabled;
  if (channel === NOTIFICATION_CHANNEL.WECOM) return !!settings.wecomEnabled;
  if (channel === NOTIFICATION_CHANNEL.FEISHU) return !!settings.feishuEnabled;
  if (channel === NOTIFICATION_CHANNEL.EMAIL) return !!settings.emailEnabled;
  return false;
}
