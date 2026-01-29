import { AppHeader } from "../_components/layout/AppHeader";
import { BentoCard } from "../_components/shared/BentoCard";
import { Icons } from "../_components/Icons";
import { TiltCard } from "../_components/shared/TiltCard";
import { DashboardStatCard } from "../_components/dashboard/DashboardStatCard";
import { UpcomingList } from "../_components/dashboard/UpcomingList";
import { InsightsCard } from "./_components/InsightsCard";
import { TodayFocusCard } from "./_components/TodayFocusCard";
import { getDashboardPageData } from "./_lib/dashboard-page-data";

export const dynamic = "force-dynamic";

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

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
          {/* Hero: Today's Focus (2x2) */}
          <div className="sm:col-span-2 sm:row-span-2">
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
          </div>

          {/* Stats 1: Todo */}
          <DashboardStatCard
            icon={<Icons.CheckSquare className="h-6 w-6" />}
            iconWrapperClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-2"
            value={stats.activeTodos}
            tickerDelay={0.2}
            label="剩余待办"
            cardDelay={0.1}
          />

          {/* Stats 2: Done */}
          <DashboardStatCard
            icon={<Icons.CheckCircle className="h-6 w-6" />}
            iconWrapperClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 mb-2"
            value={stats.doneTodosToday}
            tickerDelay={0.3}
            label="今日完成"
            cardDelay={0.15}
          />

          {/* Stats 3: Upcoming */}
          <DashboardStatCard
            icon={<Icons.Calendar className="h-6 w-6" />}
            iconWrapperClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 mb-2"
            value={stats.upcomingCount}
            tickerDelay={0.4}
            label="一周待办"
            cardDelay={0.2}
          />

          {/* Stats 4: Subscriptions */}
          <DashboardStatCard
            icon={<Icons.CreditCard className="h-6 w-6" />}
            iconWrapperClassName="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 mb-2"
            value={stats.activeSubscriptions}
            tickerDelay={0.5}
            label="活跃订阅"
            cardDelay={0.25}
          />

          {/* Upcoming: (2x2) */}
          <TiltCard className="sm:col-span-2 lg:col-span-2 lg:row-span-2" maxRotation={5}>
            <BentoCard title="即将到来" className="h-full" delay={0.3} icon={<Icons.CalendarClock className="h-5 w-5" />}>
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <UpcomingList items={upcomingVisible} timeZone={timeZone} />
              </div>
            </BentoCard>
          </TiltCard>

          {/* Insights: (2x2) */}
          <div className="sm:col-span-2 sm:row-span-2">
            <InsightsCard
              monthlySpendRows={monthlySpendRows}
              lowestDailyCostItems={lowestDailyCostItems}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
