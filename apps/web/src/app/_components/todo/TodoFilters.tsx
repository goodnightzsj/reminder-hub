import Link from "next/link";

type TodoFilter = "active" | "done" | "archived" | "all";
type PriorityFilter = "all" | "low" | "medium" | "high";

type TodoFiltersProps = {
    filter: TodoFilter;
    priorityFilter: PriorityFilter;
    tagFilter: string | null;
    taskTypeFilter: string | null;
    taskTypes: string[];
};

function buildHomeHref({
    filter,
    priority,
    tag,
    taskType,
}: {
    filter: TodoFilter;
    priority: PriorityFilter;
    tag: string | null;
    taskType: string | null;
}): string {
    const params = new URLSearchParams();
    if (filter !== "active") params.set("filter", filter);
    if (priority !== "all") params.set("priority", priority);
    if (tag) params.set("tag", tag);
    if (taskType) params.set("taskType", taskType);
    const qs = params.toString();
    return qs.length > 0 ? `/todo?${qs}` : "/todo";
}

export function TodoFilters({
    filter,
    priorityFilter,
    tagFilter,
    taskTypeFilter,
    taskTypes,
}: TodoFiltersProps) {
    return (
        <>
            <nav className="mb-3 flex flex-wrap gap-2 text-xs">
                {(
                    [
                        { key: "active", label: "进行中" },
                        { key: "done", label: "已完成" },
                        { key: "archived", label: "已归档" },
                        { key: "all", label: "全部" },
                    ] as const
                ).map((t) => (
                    <Link
                        key={t.key}
                        href={buildHomeHref({
                            filter: t.key,
                            priority: priorityFilter,
                            tag: tagFilter,
                            taskType: taskTypeFilter,
                        })}
                        className={[
                            "rounded-lg border px-3 py-2 font-medium active-press",
                            t.key === filter
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-default hover:bg-interactive-hover",
                        ].join(" ")}
                    >
                        {t.label}
                    </Link>
                ))}
            </nav>

            <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted">优先级</span>
                {(
                    [
                        { key: "all", label: "全部" },
                        { key: "high", label: "高" },
                        { key: "medium", label: "中" },
                        { key: "low", label: "低" },
                    ] as const
                ).map((p) => (
                    <Link
                        key={p.key}
                        href={buildHomeHref({
                            filter,
                            priority: p.key,
                            tag: tagFilter,
                            taskType: taskTypeFilter,
                        })}
                        className={[
                            "rounded-lg border px-3 py-2 font-medium active-press",
                            p.key === priorityFilter
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-default hover:bg-interactive-hover",
                        ].join(" ")}
                    >
                        {p.label}
                    </Link>
                ))}

                <span className="ml-2 text-muted">分类</span>
                <Link
                    href={buildHomeHref({
                        filter,
                        priority: priorityFilter,
                        tag: tagFilter,
                        taskType: null,
                    })}
                    className={[
                        "rounded-lg border px-3 py-2 font-medium active-press",
                        taskTypeFilter === null
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-default hover:bg-interactive-hover",
                    ].join(" ")}
                >
                    全部
                </Link>
                {taskTypes.map((t) => (
                    <Link
                        key={t}
                        href={buildHomeHref({
                            filter,
                            priority: priorityFilter,
                            tag: tagFilter,
                            taskType: t,
                        })}
                        className={[
                            "rounded-lg border px-3 py-2 font-medium active-press",
                            t === taskTypeFilter
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-default hover:bg-interactive-hover",
                        ].join(" ")}
                    >
                        {t}
                    </Link>
                ))}

                {tagFilter ||
                    priorityFilter !== "all" ||
                    taskTypeFilter !== null ||
                    filter !== "active" ? (
                    <Link
                        href="/todo"
                        className="rounded-lg border border-default px-3 py-2 font-medium text-muted hover:bg-interactive-hover active-press"
                    >
                        清除筛选
                    </Link>
                ) : null}
            </nav>
        </>
    );
}
