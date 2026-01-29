"use client";

import { useState } from "react";

import { Input } from "../ui/Input";
import { SmartDateInput } from "../SmartDateInput";
import { Select } from "../ui/Select";
import { CustomSelect } from "../CustomSelect";
import { Textarea } from "../ui/Textarea";
import { updateTodo } from "../../_actions/todos.actions";
import { IconCalendar } from "../Icons";
import { TodoUpdateRecurrenceField } from "./TodoUpdateRecurrenceField";
import { TodoUpdateRemindersField } from "./TodoUpdateRemindersField";
import { TodoUpdateDangerZone } from "./TodoUpdateDangerZone";
import type { TodoRecurrence, TodoRecurrenceUnit } from "./TodoRecurrence.types";
import { type TodoUpdateFormTodo } from "./TodoUpdateForm.types";
import {
    todoPriorityOptions,
    todoReminderOptionsMinutes,
    todoTaskTypeOptions,
} from "@/lib/todo";

type TodoUpdateFormProps = {
    todo: TodoUpdateFormTodo;
    tags: string[];
    recurrence: TodoRecurrence | null;
    reminders: number[];
    dueAtLocalValue: string;
    createdAtLabel: string;
};

export function TodoUpdateForm({
    todo,
    tags,
    recurrence,
    reminders,
    dueAtLocalValue,
    createdAtLabel,
}: TodoUpdateFormProps) {
    const [recurrenceUnit, setRecurrenceUnit] = useState<TodoRecurrenceUnit | "">(
        recurrence?.unit ?? "",
    );

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
                            <IconCalendar className="h-4 w-4" />
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
                    <TodoUpdateRecurrenceField
                        recurrence={recurrence}
                        recurrenceUnit={recurrenceUnit}
                        onRecurrenceUnitChange={setRecurrenceUnit}
                    />
                </div>

                {/* Section 3: Reminders (Grid Layout) */}
                <TodoUpdateRemindersField
                    reminderOptions={todoReminderOptionsMinutes}
                    reminders={reminders}
                />

                {/* Section 4: Metadata (Priority, Type, Tags) */}
                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">优先级</label>
                        <Select name="priority" defaultValue={todo.priority}>
                            {todoPriorityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">分类</label>
                        <CustomSelect
                            name="taskType"
                            defaultValue={todo.taskType}
                            options={todoTaskTypeOptions}
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

            <TodoUpdateDangerZone
                todoId={todo.id}
                createdAtLabel={createdAtLabel}
                redirectTo="/"
            />
        </div>
    );
}
