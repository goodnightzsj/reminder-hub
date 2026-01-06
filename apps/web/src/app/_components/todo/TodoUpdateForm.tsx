"use client";

import { Input } from "../Input";
import { Button } from "../Button";
import { Select } from "../Select";
import { Textarea } from "../Textarea";
import { updateTodo } from "../../_actions/todos";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteTodo } from "../../_actions/todos";

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
        <>
            <form action={updateTodo} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="id" value={todo.id} />

                <label className="flex flex-col gap-1 text-xs text-secondary">
                    标题
                    <Input
                        name="title"
                        defaultValue={todo.title}
                        autoComplete="off"
                        required
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        截止
                        <Input
                            type="datetime-local"
                            name="dueAt"
                            defaultValue={dueAtLocalValue}
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted">提醒（可多选，需设置截止）</div>
                        <div className="flex flex-wrap gap-3 rounded-lg border border-default bg-surface p-3 text-sm">
                            {reminderOptions.map((opt) => (
                                <label
                                    key={opt.minutes}
                                    className="inline-flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs text-secondary hover:bg-interactive-hover active:bg-interactive-hover/80 transition-colors cursor-pointer select-none"
                                >
                                    <input
                                        type="checkbox"
                                        name="reminderOffsetsMinutes"
                                        value={opt.minutes}
                                        defaultChecked={reminders.includes(opt.minutes)}
                                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        重复
                        <Select name="recurrenceUnit" defaultValue={recurrence?.unit ?? ""}>
                            <option value="">不重复</option>
                            <option value="day">天</option>
                            <option value="week">周</option>
                            <option value="month">月</option>
                        </Select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        间隔
                        <Input
                            type="number"
                            name="recurrenceInterval"
                            defaultValue={recurrence?.interval ?? 1}
                            min={1}
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        优先级
                        <Select name="priority" defaultValue={todo.priority}>
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                        </Select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-secondary">
                        分类（个人/公司/自定义）
                        <Input name="taskType" defaultValue={todo.taskType} />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                        标签（逗号分隔）
                        <Input name="tags" defaultValue={tags.join(", ")} />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                        备注
                        <Textarea
                            name="description"
                            rows={4}
                            defaultValue={todo.description ?? ""}
                            className="resize-y"
                        />
                    </label>
                </div>

                {todo.dueAt && recurrence && nextDueAtPreview ? (
                    <div className="rounded-lg border border-default bg-surface p-3 text-xs text-secondary">
                        完成后将自动生成下一次：截止{" "}
                        <span className="font-medium">
                            {formatDueAt(nextDueAtPreview, settings.timeZone)}
                        </span>
                    </div>
                ) : null}

                {todo.dueAt && reminders.length > 0 ? (
                    <div className="rounded-lg border border-default bg-surface p-3 text-xs text-secondary">
                        <div className="font-medium">提醒预览</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {reminders
                                .map((minutes) => ({
                                    minutes,
                                    label: getReminderLabel(minutes),
                                    at: new Date(todo.dueAt!.getTime() - minutes * 60000),
                                }))
                                .sort((a, b) => a.at.getTime() - b.at.getTime())
                                .map((p) => {
                                    const isPast = p.at.getTime() < now.getTime();
                                    return (
                                        <span
                                            key={p.minutes}
                                            className={[
                                                "rounded-md border px-2 py-1",
                                                isPast
                                                    ? "border-danger bg-danger text-danger"
                                                    : "border-divider bg-surface",
                                            ].join(" ")}
                                        >
                                            {p.label}：{formatDueAt(p.at, settings.timeZone)}
                                        </span>
                                    );
                                })}
                        </div>
                    </div>
                ) : null}

                <div className="mt-2 flex items-center justify-between gap-4">
                    <Button type="submit" variant="primary">
                        保存修改
                    </Button>

                    {/* Delete Button moved here/duplicated for convenience? 
              Originally it was separate form outside?
              Actually separate form is safer for `action`.
          */}
                </div>
            </form>

            {/* Delete Form */}
            <div className="mt-6 flex justify-end border-t border-divider pt-4">
                <form action={deleteTodo}>
                    <input type="hidden" name="id" value={todo.id} />
                    <input type="hidden" name="redirectTo" value="/" />
                    <ConfirmSubmitButton
                        confirmMessage="确定删除这个 Todo 吗？此操作不可撤销。"
                        className="h-9 rounded-lg border border-default px-3 text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        删除
                    </ConfirmSubmitButton>
                </form>
            </div>
        </>
    );
}
