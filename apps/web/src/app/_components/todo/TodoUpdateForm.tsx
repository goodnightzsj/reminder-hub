"use client";

import { Input } from "../Input";
import { SmartDateInput } from "../SmartDateInput";
import { Button } from "../Button";
import { Select } from "../Select";
import { CustomSelect } from "../CustomSelect";
import { Textarea } from "../Textarea";
import { updateTodo } from "../../_actions/todos";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteTodo } from "../../_actions/todos";
import { Icons } from "../Icons";

type TodoUpdateFormProps = {
    todo: {
        id: string;
        title: string;
        description: string | null;
        taskType: string;
        priority: "low" | "medium" | "high";
        dueAt: Date | null;
    };
    tags: string[];
    recurrence: { unit: string; interval: number } | null;
    reminders: number[];
    dueAtLocalValue: string;
    nextDueAtPreview: Date | null;
    settings: {
        timeZone: string;
    };
};

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

function getReminderLabel(offsetMinutes: number): string {
    const fromPreset = reminderOptions.find((o) => o.minutes === offsetMinutes);
    if (fromPreset) return fromPreset.label;
    if (offsetMinutes === 1) return "提前 1 分钟";
    return `提前 ${offsetMinutes} 分钟`;
}

export function TodoUpdateForm({
    todo,
    tags,
    recurrence,
    reminders,
    dueAtLocalValue,
    nextDueAtPreview,
    settings,
}: TodoUpdateFormProps) {
    const now = new Date();

    return (
        <div className="space-y-8">
            <form id="todo-update-form" action={updateTodo} className="flex flex-col gap-6">
                <input type="hidden" name="id" value={todo.id} />

                {/* Section 1: Title */}
                <div className="group space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                        标题
                    </label>
                    <div className="relative">
                        <Input
                            name="title"
                            defaultValue={todo.title}
                            autoComplete="off"
                            required
                            className="h-14 border-transparent bg-transparent px-0 text-2xl font-bold shadow-none placeholder:text-muted/30 focus:border-transparent focus:ring-0 md:text-2xl"
                            placeholder="输入任务标题..."
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-divider transition-all group-focus-within:bg-brand-primary" />
                    </div>
                </div>

                {/* Section 2: Core Details Grid */}
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Due Date */}
                    <div className="space-y-2 rounded-xl border border-default bg-surface/30 p-4 transition-colors hover:border-emphasis hover:bg-surface/50">
                        <label className="flex items-center gap-2 text-xs font-medium text-secondary">
                            <Icons.Calendar className="h-4 w-4" />
                            截止时间
                        </label>
                        <SmartDateInput
                            type="datetime-local"
                            name="dueAt"
                            defaultValue={dueAtLocalValue}
                            className="bg-transparent shadow-none focus:ring-0"
                        />
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-2 rounded-xl border border-default bg-surface/30 p-4 transition-colors hover:border-emphasis hover:bg-surface/50">
                        <label className="flex items-center gap-2 text-xs font-medium text-secondary">
                            <Icons.Refresh className="h-4 w-4" />
                            重复设置
                        </label>
                        <div className="flex gap-2">
                            <Select
                                name="recurrenceUnit"
                                defaultValue={recurrence?.unit ?? ""}
                                className="bg-transparent shadow-none focus:ring-0"
                            >
                                <option value="">不重复</option>
                                <option value="day">每天</option>
                                <option value="week">每周</option>
                                <option value="month">每月</option>
                                <option value="year">每年</option>
                            </Select>
                            {(recurrence?.unit || "") !== "" && (
                                <Input
                                    type="number"
                                    name="recurrenceInterval"
                                    defaultValue={recurrence?.interval ?? 1}
                                    min={1}
                                    className="w-20 bg-transparent shadow-none focus:ring-0"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Reminders (Grid Layout) */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                        提醒设置
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {reminderOptions.map((opt) => (
                            <label
                                key={opt.minutes}
                                className="relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-xl border border-default bg-surface/50 p-2 text-center transition-all hover:bg-interactive-hover active:scale-95 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/5 has-[:checked]:text-brand-primary"
                            >
                                <input
                                    type="checkbox"
                                    name="reminderOffsetsMinutes"
                                    value={opt.minutes}
                                    defaultChecked={reminders.includes(opt.minutes)}
                                    className="peer sr-only"
                                />
                                <span className="text-sm font-medium leading-none">{opt.label}</span>
                                <div className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-transparent transition-colors peer-checked:bg-brand-primary" />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Section 4: Metadata (Priority, Type, Tags) */}
                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">优先级</label>
                        <Select name="priority" defaultValue={todo.priority}>
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">分类</label>
                        <CustomSelect
                            name="taskType"
                            defaultValue={todo.taskType}
                            options={[
                                { value: "个人", label: "个人" },
                                { value: "公司", label: "公司" },
                                { value: "生活", label: "生活" },
                            ]}
                            placeholder="选择或输入分类..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">标签</label>
                        <Input name="tags" defaultValue={tags.join(", ")} placeholder="逗号分隔" />
                    </div>
                </div>

                {/* Section 5: Description */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-secondary">备注</label>
                    <Textarea
                        name="description"
                        rows={4}
                        defaultValue={todo.description ?? ""}
                        className="resize-y bg-surface/30 focus:bg-surface/50"
                        placeholder="添加详细说明..."
                    />
                </div>
            </form>

            <div className="flex items-center justify-between border-t border-divider pt-6">
                <span className="text-xs text-muted">
                    创建于 {new Date().toLocaleDateString()}
                </span>
                <form action={deleteTodo}>
                    <input type="hidden" name="id" value={todo.id} />
                    <input type="hidden" name="redirectTo" value="/" />
                    <ConfirmSubmitButton
                        confirmMessage="确定删除这个 Todo 吗？此操作不可撤销。"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                    >
                        <Icons.Trash className="h-3.5 w-3.5" />
                        删除任务
                    </ConfirmSubmitButton>
                </form>
            </div>
        </div>
    );
}
