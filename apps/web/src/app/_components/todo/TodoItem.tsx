import { motion } from "framer-motion";
import Link from "next/link";
import { formatRecurrenceRuleZh, parseRecurrenceRuleJson } from "@/server/recurrence";
import { Icons } from "../Icons";
import { Badge, getBadgeVariantFromLabel } from "../Badge";
import { Button } from "../Button";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import {
    deleteTodo,
    moveTodoDown,
    moveTodoUp,
    restoreTodo,
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
        deletedAt?: Date | null;
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

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
};

export function TodoItem({ item, settings }: TodoItemProps) {
    const now = new Date();
    const isDeleted = !!item.deletedAt;

    return (
        <motion.li
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-xl bg-elevated"
        >
            {/* Mobile Swipe Action (Delete) - Background Layer - HIDDEN on desktop */}
            {!isDeleted && (
                <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-destructive text-destructive-foreground sm:hidden">
                    <form action={deleteTodo} className="flex h-full w-full items-center justify-center">
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="flex h-full w-full items-center justify-center">
                            <Icons.Trash className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Main Content - Draggable */}
            <motion.div
                drag={!isDeleted ? "x" : false}
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.05}
                className="relative z-10 flex items-start gap-4 bg-elevated p-4 transition-colors hover:bg-muted/30"
                style={{ x: 0 }} // Reset x on re-render needed? No, Motion handles it.
                whileDrag={{ cursor: "grabbing" }}
            >
                {/* Priority Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.priority === "high" ? "bg-danger" :
                    item.priority === "medium" ? "bg-warning" : "bg-transparent"
                    }`} />

                <div className="flex min-w-0 flex-1 flex-col pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <Badge variant={
                            item.priority === 'high' ? 'danger' :
                                item.priority === 'medium' ? 'warning' :
                                    'blue'
                        }>
                            {priorityLabels[item.priority]}
                        </Badge>

                        {/* Category Badge */}
                        <Badge
                            variant={getBadgeVariantFromLabel(item.taskType)}
                            className="border"
                        >
                            {item.taskType}
                        </Badge>

                        {(() => {
                            const rule = parseRecurrenceRuleJson(item.recurrenceRule ?? null);
                            if (!rule) return null;
                            return <Badge variant="secondary" className="gap-1"><Icons.Repeat className="w-3 h-3" /> {formatRecurrenceRuleZh(rule)}</Badge>;
                        })()}

                        {item.isArchived ? <Badge variant="secondary">已归档</Badge> : null}
                    </div>

                    <Link
                        href={`/todo/${item.id}`}
                        className={[
                            "mt-2 block truncate text-base font-medium transition-colors hover:text-brand-primary",
                            item.isDone ? "text-muted line-through" : "text-primary",
                        ].join(" ")}
                        title={item.title}
                    >
                        {item.title}
                    </Link>

                    {item.description ? (
                        <p className="mt-1 line-clamp-1 text-sm text-secondary">
                            {item.description}
                        </p>
                    ) : null}

                    {(() => {
                        const tags = parseStringArrayJson(item.tags);
                        if (tags.length === 0) return null;
                        return (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {tags.map((t) => (
                                    <span
                                        key={`${item.id}:${t}`}
                                        className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-secondary border border-border/50"
                                    >
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Subtasks & DueDate */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                        {item.subtasks && item.subtasks.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Icons.Check className="h-3.5 w-3.5" />
                                <span>
                                    {item.subtasks.filter(s => s.isDone).length}/{item.subtasks.length}
                                </span>
                            </div>
                        )}

                        {item.dueAt && (
                            <div className={`flex items-center gap-1 ${item.dueAt < now && !item.isDone ? "text-danger" : ""}`}>
                                <Icons.Calendar className="h-3.5 w-3.5" />
                                <span>{formatDueAt(item.dueAt, settings.timeZone)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Column */}
                <div className="flex shrink-0 items-start gap-2">
                    {isDeleted ? (
                        <div className="flex flex-col items-end gap-2">
                            <form action={restoreTodo}>
                                <input type="hidden" name="id" value={item.id} />
                                <Button type="submit" size="sm" className="h-8 bg-brand-primary text-white hover:bg-brand-primary/90">
                                    恢复
                                </Button>
                            </form>

                            <form action={deleteTodo}>
                                <input type="hidden" name="id" value={item.id} />
                                <ConfirmSubmitButton
                                    confirmMessage="确定彻底删除这个 Todo 吗？"
                                    className="h-8 rounded-lg border border-danger/20 bg-danger/10 px-3 text-xs font-medium text-danger hover:bg-danger hover:text-white"
                                >
                                    彻底删除
                                </ConfirmSubmitButton>
                            </form>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-3">
                            <TodoCompleteButton
                                todoId={item.id}
                                isDone={item.isDone}
                                onToggle={toggleTodo}
                            />

                            {/* Desktop Actions - visible on hover */}
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveTodoUp(item.id)} className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface" title="上移"><Icons.ChevronRight className="w-4 h-4 -rotate-90" /></button>
                                <button onClick={() => moveTodoDown(item.id)} className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface" title="下移"><Icons.ChevronDown className="w-4 h-4" /></button>

                                <form action={setTodoArchived}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="isArchived" value={item.isArchived ? "0" : "1"} />
                                    <button
                                        type="submit"
                                        className={`p-1.5 rounded hover:bg-surface ${item.isArchived ? "text-brand-primary hover:text-brand-primary" : "text-muted hover:text-primary"}`}
                                        title={item.isArchived ? "取消归档" : "归档"}
                                    >
                                        {item.isArchived ? <Icons.ArchiveRestore className="w-4 h-4" /> : <Icons.Archive className="w-4 h-4" />}
                                    </button>
                                </form>

                                <form action={deleteTodo}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <ConfirmSubmitButton
                                        confirmMessage="确定删除这个待办吗？"
                                        className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10"
                                        title="删除"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </ConfirmSubmitButton>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.li >
    );
}

