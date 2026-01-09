"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "../Input";
import { SmartDateInput } from "../SmartDateInput";
import { Button } from "../Button";
import { Select } from "../Select";
import { CustomSelect } from "../CustomSelect";
import { Textarea } from "../Textarea";
import { createTodo } from "../../_actions/todos";
import { Icons } from "../../_components/Icons";
import { useToast } from "../Toast";

type TodoCreateFormProps = {
    timeZone: string;
    className?: string; // Allow overriding styles
};

const reminderOptions = [
    { minutes: 0, label: "到期时" },
    { minutes: 10, label: "提前 10 分钟" },
    { minutes: 60, label: "提前 1 小时" },
    { minutes: 1440, label: "提前 1 天" },
    { minutes: 4320, label: "提前 3 天" },
] as const;

export function TodoCreateForm({ timeZone, className = "mb-6" }: TodoCreateFormProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success } = useToast();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createTodo(formData);

            // Success handling
            setIsSuccess(true);
            success("创建成功");
            setDetailsOpen(false);

            // Reset form fields by forcing re-mount of inputs and resetting native form
            setFormKey(prev => prev + 1);
            formRef.current?.reset();

            // Reset success state and close modal after animation
            setTimeout(() => {
                setIsSuccess(false);
                // Close modal if open
                if (searchParams.get("modal") === "create") {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("modal");
                    router.replace(`${pathname}?${params.toString()}`);
                }
            }, 1000); // Wait 1s for user to see success tick
        } catch (error) {
            console.error("Failed to create todo:", error);
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
                            variant={isSuccess ? "primary" : "primary"}
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

                    {/* Additional options - no longer wrapped in collapsible card */}
                    <div key={`details-${formKey}`} className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            优先级
                            <Select name="priority" defaultValue="low" className="bg-surface">
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </Select>
                        </label>

                        <div className="flex flex-col gap-1 text-xs text-secondary">
                            <label>分类</label>
                            <CustomSelect
                                name="taskType"
                                defaultValue="个人"
                                options={[
                                    { value: "个人", label: "个人" },
                                    { value: "公司", label: "公司" },
                                    { value: "生活", label: "生活" },
                                ]}
                                placeholder="选择或输入分类..."
                                className="bg-surface"
                            />
                        </div>

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
                </div>
            </form>
        </div>
    );
}

