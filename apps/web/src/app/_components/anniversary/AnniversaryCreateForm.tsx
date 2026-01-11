"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { createAnniversary } from "@/app/_actions/anniversaries";
import { Icons } from "@/app/_components/Icons";
import { useToast } from "@/app/_components/Toast";

const reminderOptionsDays = [
    { days: 0, label: "当天" },
    { days: 1, label: "提前 1 天" },
    { days: 3, label: "提前 3 天" },
    { days: 7, label: "提前 7 天" },
    { days: 30, label: "提前 30 天" },
] as const;

type AnniversaryCreateFormProps = {
    dateReminderTime: string;
    timeZone: string;
    className?: string; // Allow overriding styles
};

export function AnniversaryCreateForm({
    dateReminderTime,
    timeZone,
    className = "",
}: AnniversaryCreateFormProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [dateType, setDateType] = useState<"solar" | "lunar">("solar");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success } = useToast();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createAnniversary(formData);

            setIsSuccess(true);
            success("创建成功");
            setFormKey(prev => prev + 1);
            formRef.current?.reset();
            // Reset local state if not part of formKey reset (dateType IS controlled, so we need to reset it manually or let key remount)
            // Since dateType is outside the key'd div (or we can key the content), we should reset it.
            // Better to wrap content in key or just reset state.
            setDateType("solar");

            setTimeout(() => {
                setIsSuccess(false);
                if (searchParams.get("modal") === "create") {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("modal");
                    router.replace(`${pathname}?${params.toString()}`);
                }
            }, 1000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className={`flex flex-col gap-5 ${className}`}>
            <div key={formKey} className="contents">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">标题</label>
                        <Input
                            name="title"
                            placeholder="新增纪念日（如 结婚纪念日 / 生日）"
                            className="h-12 bg-surface"
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">类型</label>
                        <Select name="category" defaultValue="纪念日" allowCustom className="h-12 bg-base/50">
                            <option value="生日">生日</option>
                            <option value="纪念日">纪念日</option>
                            <option value="节日">节日</option>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">日期类型</label>
                        <Select
                            name="dateType"
                            value={dateType}
                            onChange={(e) => setDateType(e.target.value as "solar" | "lunar")}
                            className="h-12 bg-surface"
                        >
                            <option value="solar">公历</option>
                            <option value="lunar">农历</option>
                        </Select>
                    </div>

                    {dateType === "solar" && (
                        <div className="sm:col-span-3">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">日期（公历）</label>
                            <SmartDateInput type="date" name="solarDate" required className="h-12 bg-base/50" />
                        </div>
                    )}

                    {dateType === "lunar" && (
                        <div className="sm:col-span-3">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">日期（选择公历日期，自动转换农历）</label>
                            <SmartDateInput type="date" name="solarDate" dateType="lunar" required className="h-12 bg-base/50" />
                        </div>
                    )}
                </div>

                <fieldset className="rounded-xl border border-dashed border-default p-4">
                    <legend className="px-1 text-xs font-medium text-secondary">
                        提醒设置 <span className="text-muted font-normal">(默认 {dateReminderTime}, 时区 {timeZone})</span>
                    </legend>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {reminderOptionsDays.map((opt) => (
                            <label
                                key={opt.days}
                                className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary transition-colors hover:text-brand-primary"
                            >
                                <input
                                    type="checkbox"
                                    name="remindOffsetsDays"
                                    value={opt.days}
                                    className="h-4 w-4 rounded border-default text-brand-primary focus:ring-brand-primary/20 bg-transparent"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    className={`h-11 rounded-lg px-8 text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center justify-center min-w-[8rem] ${isSuccess
                        ? "bg-success text-white hover:bg-success"
                        : "bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-md"
                        }`}
                    disabled={isSuccess || isLoading}
                >
                    {isSuccess ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            <Icons.Check className="h-5 w-5" />
                            <span>已保存</span>
                        </div>
                    ) : (
                        "保存纪念日"
                    )}
                </button>
            </div>
        </form >
    );
}
