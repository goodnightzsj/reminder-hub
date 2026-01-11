import { motion } from "framer-motion";
import Link from "next/link";
import { Tooltip } from "../Tooltip";
import { formatRecurrenceRuleZh, parseRecurrenceRuleJson } from "@/server/recurrence";
import { Icons } from "../Icons";
import { Badge, getBadgeVariantFromLabel } from "../Badge";
import { SmartCategoryBadge } from "../SmartCategoryBadge";
import { Button } from "../Button";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import {
    deleteTodo,
    moveTodoDown,
    moveTodoUp,
    restoreTodo,
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
    const isOverdue = item.dueAt && item.dueAt < now && !item.isDone;

    return (
        <motion.li
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`
                group relative overflow-hidden rounded-xl border transition-all
                ${isOverdue
                    ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.6)] hover:bg-red-500/20 dark:bg-red-900/20 dark:border-red-400'
                    : 'bg-elevated border-transparent hover:bg-muted/30'
                }
                ${!isOverdue && item.priority === 'high' ? 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_-3px_rgba(239,68,68,0.25)] dark:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]' : ''}
                ${!isOverdue && item.priority === 'medium' ? 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]' : ''}
            `}
        >
            {/* Mobile Swipe Action (Delete) - Background Layer */}
            {!isDeleted && (
                <div className="absolute inset-y-0 right-0 z-0 flex w-24 items-center justify-center bg-destructive text-destructive-foreground sm:hidden">
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
                className="relative z-10 flex items-start gap-4 bg-elevated px-5 py-4"
                whileDrag={{ x: -50 }}
            >
                {/* Priority Indicator Dot/Line */}
                <div className={`absolute left-1.5 top-2 bottom-2 w-[4px] rounded-full ${item.priority === "high" ? "bg-danger" :
                    item.priority === "medium" ? "bg-warning" : "bg-transparent"
                    }`} />

                <div className="flex min-w-0 flex-1 flex-col pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        {/* Delete/Archive Status */}
                        {isDeleted ? (
                            <SmartCategoryBadge overrideColor="red" variant="solid">
                                已删除
                            </SmartCategoryBadge>
                        ) : item.isDone ? (
                            <SmartCategoryBadge overrideColor="emerald" variant="solid">
                                已完成
                            </SmartCategoryBadge>
                        ) : (
                            <SmartCategoryBadge overrideColor="sky" variant="solid">
                                进行中
                            </SmartCategoryBadge>
                        )}

                        {/* Priority Badge */}
                        <SmartCategoryBadge
                            overrideColor={
                                item.priority === 'high' ? 'rose' :
                                    item.priority === 'medium' ? 'amber' :
                                        'blue'
                            }
                            variant="solid"
                        >
                            {priorityLabels[item.priority]}
                        </SmartCategoryBadge>

                        {/* Category Badge */}
                        <SmartCategoryBadge>
                            {item.taskType}
                        </SmartCategoryBadge>

                        {(() => {
                            const rule = parseRecurrenceRuleJson(item.recurrenceRule ?? null);
                            if (!rule) return null;
                            return (
                                <div className="flex items-center">
                                    <SmartCategoryBadge overrideColor="teal">
                                        <span className="flex items-center gap-1">
                                            <Icons.Repeat className="w-3 h-3" />
                                            {formatRecurrenceRuleZh(rule)}
                                        </span>
                                    </SmartCategoryBadge>
                                </div>
                            );
                        })()}


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
                            <div className={`flex items-center gap-1 ${isOverdue ? "text-danger font-bold" : ""}`}>
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
                                <Tooltip content="上移顺序">
                                    <button onClick={() => moveTodoUp(item.id)} className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface">
                                        <Icons.ChevronRight className="w-4 h-4 -rotate-90" />
                                    </button>
                                </Tooltip>
                                <Tooltip content="下移顺序">
                                    <button onClick={() => moveTodoDown(item.id)} className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface">
                                        <Icons.ChevronDown className="w-4 h-4" />
                                    </button>
                                </Tooltip>

                                <form action={deleteTodo}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <Tooltip content="移至回收站">
                                        <ConfirmSubmitButton
                                            confirmMessage="确定删除这个待办吗？"
                                            className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </ConfirmSubmitButton>
                                    </Tooltip>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.li >
    );
}
