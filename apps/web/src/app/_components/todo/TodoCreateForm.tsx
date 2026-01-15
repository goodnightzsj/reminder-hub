"use client";

import { useState, useRef } from "react";
import { Input } from "../Input";
import { SmartDateInput } from "../SmartDateInput";
import { Button } from "../Button";
import { Select } from "../Select";
import { CustomSelect } from "../CustomSelect";
import { Textarea } from "../Textarea";
import { createTodo } from "../../_actions/todos";
import { Icons } from "../Icons";
import { useToast } from "../Toast";
import { useTimeouts } from "../useTimeouts";
import { useCreateModal } from "@/app/_components/useCreateModal";
import { DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE, runCreateFormSuccess } from "@/app/_components/create-form.utils";
import {
    DEFAULT_TODO_TASK_TYPE,
    TODO_PRIORITY,
    todoPriorityOptions,
    todoReminderOptionsMinutes,
    todoTaskTypeOptions,
} from "@/lib/todo";
import { TodoCreateRecurrenceFields } from "./TodoCreateRecurrenceFields";
import { TodoCreateRemindersField } from "./TodoCreateRemindersField";

type TodoCreateFormProps = {
    className?: string; // Allow overriding styles
};

export function TodoCreateForm({ className = "mb-6" }: TodoCreateFormProps) {
    const { closeIfOpen } = useCreateModal();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success, error: toastError } = useToast();
    const { scheduleTimeout } = useTimeouts();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createTodo(formData);

            runCreateFormSuccess({
                setIsSuccess,
                toastSuccess: success,
                setFormKey,
                formRef,
                scheduleTimeout,
                closeCreateModalIfOpen: closeIfOpen,
            });
        } catch (error) {
            console.error("Failed to create todo:", error);
            toastError(DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={className}>
            <form
                ref={formRef}
                action={handleSubmit}
                className="flex flex-col gap-3"
            >
                {/* Inputs wrapper with key for resetting */}
                <div key={formKey} className="contents">
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
                            <SmartDateInput type="datetime-local" name="dueAt" className="h-11 bg-surface text-primary" />
                        </label>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg" // h-11
                            className={`hover:bg-opacity-90 sm:self-end active-press shadow-sm transition-all duration-300 ${isSuccess ? "bg-success hover:bg-success text-white min-w-[5rem]" : ""
                                }`}
                            loading={isLoading && !isSuccess}
                            disabled={isSuccess}
                        >
                            {isSuccess ? (
                                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                                    <Icons.Check className="h-4 w-4" />
                                    <span>已添加</span>
                                </div>
                            ) : (
                                "添加"
                            )}
                        </Button>
                    </div>

                    <TodoCreateRemindersField reminderOptions={todoReminderOptionsMinutes} />

                    {/* Additional options - no longer wrapped in collapsible card */}
                    <div key={`details-${formKey}`} className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            优先级
                            <Select name="priority" defaultValue={TODO_PRIORITY.LOW} className="bg-surface">
                                {todoPriorityOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </label>

                        <div className="flex flex-col gap-1 text-xs text-secondary">
                            <label>分类</label>
                            <CustomSelect
                                name="taskType"
                                defaultValue={DEFAULT_TODO_TASK_TYPE}
                                options={todoTaskTypeOptions}
                                placeholder="选择或输入分类..."
                                className="bg-surface"
                            />
                        </div>

                        <TodoCreateRecurrenceFields />

                        <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                            标签（逗号分隔）
                            <Input name="tags" placeholder="工作, 学习" className="bg-surface" />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                            备注
                            <Textarea name="description" rows={3} className="resize-y bg-surface" />
                        </label>
                    </div>
                </div>
            </form>
        </div>
    );
}
