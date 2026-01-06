"use client";


// Actually createTodo is a Server Action so it's fine.
// But settings (timeZone) was passed as prop in page.tsx.
// I should pass settings as prop here too.

import { Input } from "../Input";
import { Button } from "../Button";
import { Select } from "../Select";
import { CustomSelect } from "../CustomSelect";
import { Textarea } from "../Textarea";
import { createTodo } from "../../_actions/todos";

type TodoCreateFormProps = {
    timeZone: string;
};

const reminderOptions = [
    { minutes: 0, label: "到期时" },
    { minutes: 10, label: "提前 10 分钟" },
    { minutes: 60, label: "提前 1 小时" },
    { minutes: 1440, label: "提前 1 天" },
    { minutes: 4320, label: "提前 3 天" },
] as const;

export function TodoCreateForm({ timeZone }: TodoCreateFormProps) {
    return (
        <div className="mb-6">
            <form action={createTodo} className="flex flex-col gap-3">
                <Input
                    name="title"
                    placeholder="添加一个待办..."
                    autoComplete="off"
                    required
                    className="h-12 bg-surface text-base"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex flex-1 items-center gap-3 text-xs text-secondary">
                        <span className="w-12 shrink-0">截止</span>
                        <Input type="datetime-local" name="dueAt" className="h-11 bg-surface text-primary" />
                    </label>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg" // h-11
                        className="hover:bg-opacity-90 sm:self-end active-press shadow-sm"
                    >
                        添加
                    </Button>
                </div>

                <p className="text-xs text-muted">
                    截止时间按时区 <code className="font-mono">{timeZone}</code> 解释。
                </p>

                <fieldset className="mt-1">
                    <legend className="text-xs text-secondary">
                        提醒（可多选，需设置截止）
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {reminderOptions.map((opt) => (
                            <label
                                key={opt.minutes}
                                className="inline-flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs text-primary hover:bg-interactive-hover active:bg-interactive-hover/80 transition-colors cursor-pointer select-none"
                            >
                                <input
                                    type="checkbox"
                                    name="reminderOffsetsMinutes"
                                    value={opt.minutes}
                                    className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <details className="rounded-lg border border-default bg-surface/50 p-3 text-sm">
                    <summary className="cursor-pointer select-none text-xs font-medium text-secondary">
                        更多选项（优先级/分类/重复/标签/备注）
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            优先级
                            <Select name="priority" defaultValue="medium" className="bg-surface">
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </Select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            分类（个人/公司/自定义）
                            <CustomSelect
                                name="taskType"
                                defaultValue="personal"
                                options={[
                                    { value: "personal", label: "个人" },
                                    { value: "work", label: "工作" },
                                    { value: "life", label: "生活" },
                                ]}
                                placeholder="输入自定义分类..."
                                className="bg-surface"
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            重复
                            <Select name="recurrenceUnit" defaultValue="" className="bg-surface">
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
                                defaultValue={1}
                                min={1}
                                className="bg-surface"
                            />
                        </label>

                        <p className="text-xs text-muted sm:col-span-2">
                            提示：重复任务需设置截止时间；完成后会自动生成下一次。
                        </p>

                        <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                            标签（逗号分隔）
                            <Input name="tags" placeholder="工作, 学习" className="bg-surface" />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                            备注
                            <Textarea name="description" rows={3} className="resize-y bg-surface" />
                        </label>
                    </div>
                </details>
            </form>
        </div>
    );
}
