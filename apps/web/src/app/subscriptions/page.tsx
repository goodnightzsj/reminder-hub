import { asc, desc, eq, ne, isNull, isNotNull, and, type SQL } from "drizzle-orm";

import { SegmentedControl } from "@/app/_components/SegmentedControl";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { SubscriptionCreateForm } from "@/app/_components/subscriptions/SubscriptionCreateForm";
import { SubscriptionList } from "@/app/_components/subscriptions/SubscriptionList";
import { EmptyState } from "@/app/_components/EmptyState";
import {
  deleteSubscription,
  renewSubscription,
  setSubscriptionArchived,
} from "@/app/_actions/subscriptions";
import { AppHeader } from "@/app/_components/AppHeader";
import { CreateModal } from "@/app/_components/CreateModal";
import { ServiceIconBadge } from "@/app/_components/ServiceIconBadge";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  addDaysToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";

import { subscriptions, serviceIcons } from "@/server/db/schema";

import Link from "next/link";
import { getColorClass } from "@/app/_components/SmartCategoryBadge";

export const dynamic = "force-dynamic";


type SubscriptionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return null;
}

function parseNumberArrayJson(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

type SubscriptionFilter = "active" | "archived" | "all" | "trash";

function parseFilter(raw: string | null): SubscriptionFilter {
  if (raw === "active") return "active";
  if (raw === "archived") return "archived";
  if (raw === "all") return "all";
  if (raw === "trash") return "trash";
  return "active";
}

// ... 

export default async function SubscriptionsPage({
  searchParams,
}: SubscriptionsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));
  const categoryFilter = getParam(params, "category");

  function buildHref({ filter: f, category: c }: { filter: SubscriptionFilter; category: string | null }) {
    const p = new URLSearchParams();
    if (f !== "active") p.set("filter", f);
    if (c) p.set("category", c);
    const qs = p.toString();
    return qs.length > 0 ? `/subscriptions?${qs}` : "/subscriptions";
  }

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;
  const today = formatDateString(getDatePartsInTimeZone(new Date(), timeZone));

  // Base filter condition
  const baseWhere =
    filter === "trash"
      ? isNotNull(subscriptions.deletedAt)
      : isNull(subscriptions.deletedAt);

  let where: SQL | undefined = baseWhere;

  if (filter === "active") {
    where = and(baseWhere, eq(subscriptions.isArchived, false));
  } else if (filter === "archived") {
    where = and(baseWhere, eq(subscriptions.isArchived, true));
  }

  // Combine with Category Filter
  if (categoryFilter) {
    where = and(where, eq(subscriptions.category, categoryFilter));
  }

  // 废纸篓：按删除时间升序（先删除的在上面）
  // 按照要求：默认按创建时间排序 (Creation Time Newest First)
  const orderByClause = filter === "trash"
    ? [asc(subscriptions.deletedAt)]
    : [desc(subscriptions.createdAt)];





  const query = where
    ? db.select().from(subscriptions).leftJoin(serviceIcons, eq(subscriptions.name, serviceIcons.name)).where(where)
    : db.select().from(subscriptions).leftJoin(serviceIcons, eq(subscriptions.name, serviceIcons.name));

  const results = await query.orderBy(...orderByClause);

  const rows = results.map(({ subscriptions: s, service_icons: i }) => ({
    ...s,
    icon: i?.icon ?? s.icon,
    color: i?.color ?? s.color,
  }));


  const distinctCategories = await db
    .selectDistinct({ name: subscriptions.category })
    .from(subscriptions)
    .where(and(
      isNotNull(subscriptions.category),
      ne(subscriptions.category, ""),
      // Filter categories based on the CURRENT status filter (baseWhere)
      // We want to see categories that exist in the current tab (Active/Archived/Trash)
      baseWhere,
      // Also respect archive status for categories if needed
      filter === "active" ? eq(subscriptions.isArchived, false) :
        filter === "archived" ? eq(subscriptions.isArchived, true) : undefined
    ))
    .orderBy(subscriptions.category);


  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="订阅"
        />

        {/* Mobile Create Modal */}
        <CreateModal title="新建订阅">
          <SubscriptionCreateForm
            dateReminderTime={dateReminderTime}
            timeZone={timeZone}
            className=""
          />
        </CreateModal>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
              <SegmentedControl
                options={[
                  { key: "active", label: "进行中", href: buildHref({ filter: "active", category: categoryFilter }) },
                  { key: "trash", label: "回收站", href: buildHref({ filter: "trash", category: categoryFilter }) },
                ]}
                currentValue={filter}
                layoutId="subscription-filter"
              />
            </div>

            {distinctCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
                <span className="text-muted shrink-0 mr-1">分类</span>
                <Link
                  href={buildHref({ filter, category: null })}
                  className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${!categoryFilter
                    ? "bg-brand-primary/10 text-brand-primary font-medium"
                    : "bg-surface hover:bg-surface/80 text-secondary"
                    }`}
                >
                  全部
                </Link>
                {distinctCategories.map((c) => {
                  const colorClass = getColorClass(c.name);
                  const isSelected = categoryFilter === c.name;
                  return (
                    <Link
                      key={c.name}
                      href={buildHref({ filter, category: c.name })}
                      className={`inline-flex items-center rounded-full px-3 py-1 transition-all border ${isSelected
                        ? colorClass
                        : "bg-surface hover:bg-surface/80 text-secondary border-transparent"
                        }`}
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <SubscriptionList
            items={rows.map((item) => {
              const offsets = parseNumberArrayJson(item.remindOffsetsDays);
              const daysLeft = diffDays(today, item.nextRenewDate);

              // Calculate cycle label
              const cycleLabel = item.cycleInterval === 1
                ? (item.cycleUnit === "year" ? "年付" : "月付")
                : `每 ${item.cycleInterval} ${item.cycleUnit === "year" ? "年" : "月"}`;

              let progressColor = "bg-brand-primary";
              let urgencyClass = "";
              if (daysLeft !== null) {
                if (daysLeft <= 3) {
                  progressColor = "bg-[#dc2626]"; // danger solid
                  urgencyClass = "text-danger font-medium";
                } else if (daysLeft <= 7) {
                  progressColor = "bg-[#d97706]"; // warning solid
                  urgencyClass = "text-warning";
                }
              }

              const preview = offsets
                .map((days) => {
                  const date = addDaysToDateString(item.nextRenewDate, -days);
                  if (!date) return null;
                  const at = dateTimeLocalToUtcDate(
                    `${date}T${dateReminderTime}`,
                    timeZone,
                  );
                  if (!at) return null;
                  return {
                    days,
                    label: days === 0 ? "到期日" : `提前 ${days} 天`,
                    at,
                  };
                })
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .sort((a, b) => a.at.getTime() - b.at.getTime());

              return { item, cycleLabel, daysLeft, progressColor, urgencyClass, preview };
            })}
            filter={filter}
          />

          {rows.length === 0 && (
            <div className="border-t border-divider">
              <EmptyState
                title={
                  filter === "trash"
                    ? "回收站为空"
                    : "还没有订阅"
                }
                description={
                  filter === "trash"
                    ? "你的回收站很干净。"
                    : "记录你的周期性订阅，在续期日提前提醒。"
                }
              />
            </div>
          )}
        </section>
      </main>
    </div >
  );
}
