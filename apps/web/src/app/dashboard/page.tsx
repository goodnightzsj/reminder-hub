import type { Metadata } from "next";
import { AppHeader } from "../_components/layout/AppHeader";
import { BentoCard } from "../_components/shared/BentoCard";
import { IconCalendar, IconCalendarClock, IconCheckCircle, IconCheckSquare, IconCreditCard } from "../_components/Icons";
import { TiltCard } from "../_components/shared/TiltCard";
import { DashboardStatCard } from "../_components/dashboard/DashboardStatCard";
import { UpcomingList } from "../_components/dashboard/UpcomingList";
import { InsightsCard } from "./_components/InsightsCard";
import { TodayFocusCard } from "./_components/TodayFocusCard";
import { getDashboardPageData } from "./_lib/dashboard-page-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "仪表盘",
  description: "集中查看今天待办、即将到来的纪念日、订阅与关键统计。",
};

export default async function DashboardPage() {
  const {
    greeting,
    timeZone,
    stats,
    overdueTodos,
    todayTodos,
    todayAnniversaries,
    todaySubscriptions,
    upcomingVisible,
    monthlySpendRows,
    lowestDailyCostItems,
  } = await getDashboardPageData();

  return (
    <div className="min-h-dvh bg-base font-sans text-primary animate-fade-in pb-20 sm:pb-10">
      <main className="mx-auto max-w-5xl py-10 px-fluid">
        <AppHeader
          title={greeting}
        />

        {/* 视觉节奏：Hero / Stats 子组 / Upcoming / Insights 形成 2×2 大块；stats 子组内部 gap-2 收紧，
            外层 gap-4 形成"紧 vs 松"的节奏差，避免所有卡片视觉权重雷同。 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {/* Hero: Today's Focus */}
          <TodayFocusCard
            overdueTodoCount={stats.overdueTodos}
            todayTodoCount={stats.todayTodos}
            todayAnniversaryCount={stats.todayAnniversaries}
            todaySubscriptionCount={stats.todaySubscriptions}
            overdueTodos={overdueTodos}
            todayTodos={todayTodos}
            todayAnniversaries={todayAnniversaries}
            todaySubscriptions={todaySubscriptions}
            timeZone={timeZone}
          />

          {/* Stats 子组：2x2 紧凑排布，视觉上成为一个"数据概览"单元 */}
          <div className="grid grid-cols-2 gap-2">
            <DashboardStatCard
              icon={<IconCheckSquare className="h-5 w-5" />}
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary mb-1.5"
              value={stats.activeTodos}
              tickerDelay={0.2}
              label="剩余待办"
              cardDelay={0.1}
            />
            <DashboardStatCard
              icon={<IconCheckCircle className="h-5 w-5" />}
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600 mb-1.5"
              value={stats.doneTodosToday}
              tickerDelay={0.3}
              label="今日完成"
              cardDelay={0.15}
            />
            <DashboardStatCard
              icon={<IconCalendar className="h-5 w-5" />}
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-1.5"
              value={stats.upcomingCount}
              tickerDelay={0.4}
              label="一周待办"
              cardDelay={0.2}
            />
            <DashboardStatCard
              icon={<IconCreditCard className="h-5 w-5" />}
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 mb-1.5"
              value={stats.activeSubscriptions}
              tickerDelay={0.5}
              label="活跃订阅"
              cardDelay={0.25}
            />
          </div>

          {/* Upcoming */}
          <TiltCard maxRotation={5}>
            <BentoCard title="即将到来" className="h-full" delay={0.3} icon={<IconCalendarClock className="h-5 w-5" />}>
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <UpcomingList items={upcomingVisible} timeZone={timeZone} />
              </div>
            </BentoCard>
          </TiltCard>

          {/* Insights */}
          <InsightsCard
            monthlySpendRows={monthlySpendRows}
            lowestDailyCostItems={lowestDailyCostItems}
          />
        </div>
      </main>
    </div>
  );
}
