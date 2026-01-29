import Link from "next/link";

import { renewSubscription } from "@/app/_actions/subscriptions";
import { toggleTodo } from "@/app/_actions/todos.actions";
import { formatDateTime } from "@/lib/format";
import { ANNIVERSARY_DATE_TYPE } from "@/lib/anniversary";
import { ROUTES } from "@/lib/routes";
import { BentoCard } from "../../_components/shared/BentoCard";
import { Button } from "../../_components/ui/Button";
import { IconAlertTriangle, IconCalendar, IconCheck, IconCreditCard, IconGift, IconInbox, IconZap } from "../../_components/Icons";
import { Tooltip } from "../../_components/ui/Tooltip";

import type {
    AnniversaryPreview,
    SubscriptionPreview,
    TodoPreview,
} from "../_lib/dashboard-page-data";

type TodayFocusCardProps = {
    overdueTodoCount: number;
    todayTodoCount: number;
    todayAnniversaryCount: number;
    todaySubscriptionCount: number;
    overdueTodos: TodoPreview[];
    todayTodos: TodoPreview[];
    todayAnniversaries: AnniversaryPreview[];
    todaySubscriptions: SubscriptionPreview[];
    timeZone: string;
};

export function TodayFocusCard({
    overdueTodoCount,
    todayTodoCount,
    todayAnniversaryCount,
    todaySubscriptionCount,
    overdueTodos,
    todayTodos,
    todayAnniversaries,
    todaySubscriptions,
    timeZone,
}: TodayFocusCardProps) {
    const hasOverdueTodos = overdueTodos.length > 0;
    const hasTodayTodos = todayTodos.length > 0;
    const hasTodayAnniversaries = todayAnniversaries.length > 0;
    const hasTodaySubscriptions = todaySubscriptions.length > 0;
    const isEmpty =
        !hasOverdueTodos && !hasTodayTodos && !hasTodayAnniversaries && !hasTodaySubscriptions;

    return (
        <BentoCard
            title="今日聚焦"
            className="h-full border-brand-primary/20"
            glow={true}
            delay={0.05}
            icon={<IconZap className="h-5 w-5 text-brand-primary" />}
        >
            <div className="flex bg-surface/50 rounded-lg p-3 mb-4 items-center justify-between text-xs text-secondary">
                <span>逾期 {overdueTodoCount}</span>
                <span className="text-muted">|</span>
                <span>待办 {todayTodoCount}</span>
                <span className="text-muted">|</span>
                <span>纪念日 {todayAnniversaryCount}</span>
                <span className="text-muted">|</span>
                <span>订阅 {todaySubscriptionCount}</span>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Overdue */}
                {hasOverdueTodos && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-danger">
                            <IconAlertTriangle className="h-3 w-3" />
                            <span>逾期事项 ({overdueTodos.length})</span>
                        </div>
                        <ul className="space-y-2">
                            {overdueTodos.map((t) => (
                                <li
                                    key={t.id}
                                    className="group flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50"
                                >
                                    <Link
                                        href={`${ROUTES.todo}/${t.id}`}
                                        className="flex-1 truncate text-sm font-medium hover:underline"
                                    >
                                        {t.title}
                                    </Link>
                                    <span className="text-xs text-danger font-mono ml-3">
                                        {formatDateTime(t.dueAt!, timeZone)}
                                    </span>
                                    <form
                                        action={toggleTodo}
                                        className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <input type="hidden" name="id" value={t.id} />
                                        <input type="hidden" name="isDone" value="1" />
                                        <Tooltip content="标记为已完成" side="left">
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-brand-primary hover:text-white border border-transparent hover:border-brand-primary/50"
                                            >
                                                <IconCheck active className="h-3 w-3" />
                                            </Button>
                                        </Tooltip>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Today */}
                {hasTodayTodos && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                            <IconCalendar className="h-3 w-3" />
                            <span>今日待办 ({todayTodos.length})</span>
                        </div>
                        <ul className="space-y-2">
                            {todayTodos.map((t) => (
                                <li
                                    key={t.id}
                                    className="group flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`${ROUTES.todo}/${t.id}`}
                                            className="block truncate text-sm font-medium hover:underline"
                                        >
                                            {t.title}
                                        </Link>
                                        <div className="text-[10px] text-muted mt-0.5">
                                            {formatDateTime(t.dueAt!, timeZone)}
                                        </div>
                                    </div>
                                    <form
                                        action={toggleTodo}
                                        className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <input type="hidden" name="id" value={t.id} />
                                        <input type="hidden" name="isDone" value="1" />
                                        <Tooltip content="标记为已完成" side="left">
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-full hover:bg-brand-primary hover:text-white border border-transparent hover:border-brand-primary/50"
                                            >
                                                <IconCheck active className="h-3.5 w-3.5" />
                                            </Button>
                                        </Tooltip>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Today Anniversaries */}
                {hasTodayAnniversaries && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-pink-500">
                            <IconGift className="h-3 w-3" />
                            <span>今日纪念 ({todayAnniversaries.length})</span>
                        </div>
                        <ul className="space-y-2">
                            {todayAnniversaries.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50"
                                >
                                    <Link
                                        href={`${ROUTES.anniversaries}/${a.id}`}
                                        className="truncate text-sm font-medium hover:underline"
                                    >
                                        {a.title}
                                    </Link>
                                    <span className="text-xs text-muted ml-3">
                                        {a.dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? "公历" : "农历"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Today Subscriptions */}
                {hasTodaySubscriptions && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                            <IconCreditCard className="h-3 w-3" />
                            <span>今日续费 ({todaySubscriptions.length})</span>
                        </div>
                        <ul className="space-y-2">
                            {todaySubscriptions.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`${ROUTES.subscriptions}/${s.id}`}
                                            className="block truncate text-sm font-medium hover:underline"
                                        >
                                            {s.name}
                                        </Link>
                                    </div>
                                    <form action={renewSubscription} className="ml-3 shrink-0">
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="redirectTo" value={`${ROUTES.subscriptions}/${s.id}`} />
                                        <Button type="submit" variant="primary" size="sm">
                                            续期
                                        </Button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Empty State */}
                {isEmpty && (
                    <div className="flex h-40 flex-col items-center justify-center text-center text-muted">
                        <IconInbox className="h-10 w-10 opacity-20 mb-3" />
                        <p className="text-sm">今天暂无特别事项</p>
                        <p className="text-xs opacity-70">享受美好的一天！</p>
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
