import { asc, desc, eq, ne, isNull, isNotNull, and, type SQL } from "drizzle-orm";

import { SegmentedControl } from "@/app/_components/SegmentedControl";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { AnniversaryCreateForm } from "@/app/_components/anniversary/AnniversaryCreateForm";
import { AnniversaryList } from "@/app/_components/anniversary/AnniversaryList";
import { EmptyState } from "@/app/_components/EmptyState";
import {
  createAnniversary,
  deleteAnniversary,
  setAnniversaryArchived,
} from "@/app/_actions/anniversaries";
import { AppHeader } from "@/app/_components/AppHeader";
import { CreateModal } from "@/app/_components/CreateModal";
import { UrgencyBadge } from "@/app/_components/UrgencyBadge";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  addDaysToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { anniversaries } from "@/server/db/schema";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";

export const dynamic = "force-dynamic";




type AnniversariesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const categoryLabels: Record<string, string> = {
  "生日": "生日",
  "纪念日": "纪念日",
  "节日": "节日",
  birthday: "生日",
  anniversary: "纪念日",
  festival: "节日",
  custom: "自定义",
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

type AnniversaryFilter = "active" | "archived" | "all" | "trash";

function parseFilter(raw: string | null): AnniversaryFilter {
  if (raw === "active") return "active";
  if (raw === "archived") return "archived";
  if (raw === "all") return "all";
  if (raw === "trash") return "trash";
  return "active";
}

// ... 

export default async function AnniversariesPage({
  searchParams,
}: AnniversariesPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));
  const categoryFilter = getParam(params, "category");

  function buildHref({ filter: f, category: c }: { filter: AnniversaryFilter; category: string | null }) {
    const p = new URLSearchParams();
    if (f !== "active") p.set("filter", f);
    if (c) p.set("category", c);
    const qs = p.toString();
    return qs.length > 0 ? `/anniversaries?${qs}` : "/anniversaries";
  }

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;
  const today = formatDateString(getDatePartsInTimeZone(new Date(), timeZone));

  const baseWhere =
    filter === "trash"
      ? isNotNull(anniversaries.deletedAt)
      : isNull(anniversaries.deletedAt);

  let where: SQL | undefined = baseWhere;

  if (filter === "active") {
    where = and(baseWhere, eq(anniversaries.isArchived, false));
  } else if (filter === "archived") {
    where = and(baseWhere, eq(anniversaries.isArchived, true));
  }
  // 'all' implies baseWhere (not deleted)
  // 'trash' implies baseWhere (deleted)

  if (categoryFilter) {
    where = and(where, eq(anniversaries.category, categoryFilter));
  }

  // 废纸篓：按删除时间升序（先删除的在上面）
  const orderByClause = filter === "trash"
    ? [asc(anniversaries.deletedAt)]
    : [asc(anniversaries.isArchived), desc(anniversaries.createdAt)];

  const rows = await (where
    ? db.select().from(anniversaries).where(where)
    : db.select().from(anniversaries)
  ).orderBy(...orderByClause);

  const distinctCategories = await db
    .selectDistinct({ name: anniversaries.category })
    .from(anniversaries)
    // Filter categories based on the CURRENT status filter (baseWhere)
    // We want to see categories that exist in the current tab (Active/Archived/Trash)
    .where(and(isNotNull(anniversaries.category), ne(anniversaries.category, ""), baseWhere))
    .orderBy(anniversaries.category);

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="纪念日"
          description="v0.2：倒计时 + 提醒预览（支持公历/农历；外部通知后置）。"
        />



        {/* Mobile Create Modal */}
        <CreateModal title="新建纪念日">
          <AnniversaryCreateForm
            dateReminderTime={dateReminderTime}
            timeZone={timeZone}
            className=""
          />
        </CreateModal>

        <section className="rounded-xl border border-default bg-elevated shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <h2 className="text-sm font-medium">列表</h2>
            <SegmentedControl
              options={[
                { key: "active", label: "进行中", href: buildHref({ filter: "active", category: categoryFilter }) },
                { key: "trash", label: "回收站", href: buildHref({ filter: "trash", category: categoryFilter }) },
              ]}
              currentValue={filter}
              layoutId="anniversary-filter"
            />
          </div>

          {distinctCategories.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-muted">类型</span>
                <SegmentedControl
                  options={[
                    { key: "all", label: "全部", href: buildHref({ filter, category: null }) },
                    ...distinctCategories.map((c) => ({
                      key: c.name!,
                      label: categoryLabels[c.name!] ?? c.name!,
                      href: buildHref({ filter, category: c.name }),
                    }))
                  ]}
                  currentValue={categoryFilter ?? "all"}
                  layoutId="anniversary-category-filter"
                />
              </div>
            </div>
          )}

          <AnniversaryList
            items={rows.map((item) => {
              const nextDate =
                item.dateType === "solar"
                  ? getNextSolarOccurrenceDateString(item.date, today)
                  : getNextLunarOccurrenceDateString(item.date, today, {
                    isLeapMonth: item.isLeapMonth,
                  });

              const daysLeft = nextDate ? diffDays(today, nextDate) : null;

              const offsets = parseNumberArrayJson(item.remindOffsetsDays);
              const preview = nextDate
                ? offsets
                  .map((days) => {
                    const date = addDaysToDateString(nextDate, -days);
                    if (!date) return null;
                    const at = dateTimeLocalToUtcDate(
                      `${date}T${dateReminderTime}`,
                      timeZone,
                    );
                    if (!at) return null;
                    return {
                      days,
                      label: days === 0 ? "当天" : `提前 ${days} 天`,
                      at,
                    };
                  })
                  .filter((p): p is NonNullable<typeof p> => p !== null)
                  .sort((a, b) => a.at.getTime() - b.at.getTime())
                : [];

              return { item, daysLeft, nextDate, preview };
            })}
          />
          {rows.length === 0 && (
            <div className="border-t border-divider">
              <EmptyState
                title={
                  filter === "trash"
                    ? "回收站为空"
                    : "还没有纪念日"
                }
                description={
                  filter === "trash"
                    ? "你的回收站很干净。"
                    : "点击上方添加按钮，不再错过重要日子。"
                }
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
