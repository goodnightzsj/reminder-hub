import Link from "next/link";
import { formatRecurrenceRuleZh, parseRecurrenceRuleJson } from "@/server/recurrence";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import {
    deleteTodo,
    setTodoArchived,
    toggleTodo,
} from "../../_actions/todos";
import { TodoCompleteButton } from "./TodoCompleteButton";

type TodoItemProps = {
    item: {
        id: string;
        title: string;
        description: string | null;
        taskType: string;
        priority: "low" | "medium" | "high";
        tags: string; // JSON string
        dueAt: Date | null;
        reminderOffsetsMinutes: string; // JSON string
        recurrenceRule: string | null; // JSON string
        isDone: boolean;
        isArchived: boolean;
        subtasks?: {
            id: string;
            isDone: boolean;
        }[];
    };
    settings: {
        timeZone: string;
    };
    staggerClass?: string;
};

const priorityLabels = {
    low: "低",
    medium: "中",
    high: "高",
} as const;

const reminderOptions = [
    { minutes: 0, label: "到期时" },
    { minutes: 10, label: "提前 10 分钟" },
    { minutes: 60, label: "提前 1 小时" },
    { minutes: 1440, label: "提前 1 天" },
    { minutes: 4320, label: "提前 3 天" },
] as const;

function formatDueAt(dueAt: Date, timeZone: string) {
    return new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
    }).format(dueAt);
}

function parseStringArrayJson(value: string): string[] {
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((v): v is string => typeof v === "string");
    } catch {
        return [];
    }
}

function parseReminderOffsetsMinutes(value: string): number[] {
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

function getReminderLabel(offsetMinutes: number): string {
    const fromPreset = reminderOptions.find((o) => o.minutes === offsetMinutes);
    if (fromPreset) return fromPreset.label;
    if (offsetMinutes === 1) return "提前 1 分钟";
    return `提前 ${offsetMinutes} 分钟`;
}

export function TodoItem({ item, settings, staggerClass = "" }: TodoItemProps) {
    const now = new Date();

    return (
        <li className={`group animate-slide-up flex items-start gap-3 p-4 hover:bg-interactive-hover transition-colors rounded-xl ${staggerClass}`}>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>{priorityLabels[item.priority]}</Badge>
                    <Badge>{item.taskType}</Badge>

                    {(() => {
                        const rule = parseRecurrenceRuleJson(item.recurrenceRule ?? null);
                        if (!rule) return null;
                        return <Badge>{formatRecurrenceRuleZh(rule)}</Badge>;
                    })()}

                    {item.isArchived ? <Badge>已归档</Badge> : null}
                </div>

                <Link
                    href={`/todo/${item.id}`}
                    className={[
                        "mt-1 truncate text-sm font-medium hover:underline",
                        item.isDone ? "text-muted line-through" : "text-primary",
                    ].join(" ")}
                    title={item.title}
                >
                    {item.title}
                </Link>

                {(() => {
                    const tags = parseStringArrayJson(item.tags);
                    if (tags.length === 0) return null;
                    return (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                                <Badge
                                    key={`${item.id}:${t}`}
                                    className="text-secondary border-divider bg-surface"
                                >
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    );
                })()}

                {/* Subtasks Indicator */}
                {item.subtasks && item.subtasks.length > 0 ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span>
                            {item.subtasks.filter(s => s.isDone).length}/{item.subtasks.length} 子任务
                        </span>
                    </div>
                ) : null}

                {item.dueAt ? (
                    <>
                        <span className="mt-1 text-xs text-muted">
                            截止 {formatDueAt(item.dueAt, settings.timeZone)}
                        </span>

                        {(() => {
                            const dueAt = item.dueAt;
                            if (!dueAt) return null;

                            const offsets = parseReminderOffsetsMinutes(item.reminderOffsetsMinutes);
                            if (offsets.length === 0) return null;

                            const preview = offsets
                                .map((minutes) => ({
                                    minutes,
                                    label: getReminderLabel(minutes),
                                    at: new Date(dueAt.getTime() - minutes * 60000),
                                }))
                                .sort((a, b) => a.at.getTime() - b.at.getTime());

                            return (
                                <div className="mt-2 flex flex-col gap-1 text-xs text-muted">
                                    <div>提醒预览：</div>
                                    <div className="flex flex-wrap gap-2">
                                        {preview.map((p) => {
                                            const isPast = p.at.getTime() < now.getTime();
                                            return (
                                                <span
                                                    key={`${item.id}:${p.minutes}`}
                                                    className={[
                                                        "rounded-md border px-2 py-1",
                                                        isPast
                                                            ? "border-danger bg-danger text-danger"
                                                            : "border-divider bg-surface",
                                                    ].join(" ")}
                                                >
                                                    {p.label}： {formatDueAt(p.at, settings.timeZone)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                ) : null}

                {item.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted">
                        {item.description}
                    </p>
                ) : null}
            </div>

            <div className="flex shrink-0 items-start gap-2">
                {/* Move buttons - hidden on mobile */}
                <div className="hidden sm:flex flex-col gap-0.5">
                    <form action={async () => {
                        "use server";
                        const { moveTodoUp } = await import("@/app/_actions/todos");
                        await moveTodoUp(item.id);
                    }}>
                        <button
                            type="submit"
                            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-interactive-hover hover:text-primary active:scale-95 transition-transform"
                            title="上移"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6" />
                            </svg>
                        </button>
                    </form>
                    <form action={async () => {
                        "use server";
                        const { moveTodoDown } = await import("@/app/_actions/todos");
                        await moveTodoDown(item.id);
                    }}>
                        <button
                            type="submit"
                            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-interactive-hover hover:text-primary active:scale-95 transition-transform"
                            title="下移"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                    </form>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <TodoCompleteButton
                        todoId={item.id}
                        isDone={item.isDone}
                        onToggle={toggleTodo}
                    />

                    <form action={setTodoArchived}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                            type="hidden"
                            name="isArchived"
                            value={item.isArchived ? "0" : "1"}
                        />
                        <Button type="submit" variant="outline" size="sm" className="h-9">
                            {item.isArchived ? "取消归档" : "归档"}
                        </Button>
                    </form>

                    <form action={deleteTodo}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmSubmitButton
                            confirmMessage="确定删除这个 Todo 吗？此操作不可撤销。"
                            className="h-9 rounded-lg border border-default px-3 text-xs font-medium text-danger hover:bg-danger dark:hover:bg-danger-hover"
                        >
                            删除
                        </ConfirmSubmitButton>
                    </form>
                </div>
            </div>
        </li>
    );
}
