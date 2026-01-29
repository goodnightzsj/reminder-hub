"use client";

import { useState, useRef } from "react";
import { Input } from "@/app/_components/ui/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { createAnniversary } from "@/app/_actions/anniversaries";
import { Icons } from "@/app/_components/Icons";
import { useToast } from "@/app/_components/ui/Toast";
import { useTimeouts } from "@/app/_components/hooks/useTimeouts";
import { useCreateModal } from "../hooks/useCreateModal";
import { DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE, runCreateFormSuccess } from "@/app/_components/create-form.utils";
import { anniversaryReminderOptionsDays } from "@/lib/reminder-options";
import {
    ANNIVERSARY_DATE_TYPE,
    DEFAULT_ANNIVERSARY_DATE_TYPE,
    anniversaryCategoryOptions,
    isAnniversaryDateType,
    type AnniversaryDateType,
} from "@/lib/anniversary";

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
    const { closeIfOpen } = useCreateModal();
    const [dateType, setDateType] = useState<AnniversaryDateType>(DEFAULT_ANNIVERSARY_DATE_TYPE);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success, error: toastError } = useToast();
    const { scheduleTimeout } = useTimeouts();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createAnniversary(formData);

            runCreateFormSuccess({
                setIsSuccess,
                toastSuccess: success,
                setFormKey,
                formRef,
                scheduleTimeout,
                closeCreateModalIfOpen: closeIfOpen,
                afterReset: () => setDateType(DEFAULT_ANNIVERSARY_DATE_TYPE),
            });
        } catch (error) {
            console.error(error);
            toastError(DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE);
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
                            {anniversaryCategoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">日期类型</label>
                        <Select
                            name="dateType"
                            value={dateType}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (isAnniversaryDateType(value)) setDateType(value);
                            }}
                            className="h-12 bg-surface"
                        >
                            <option value={ANNIVERSARY_DATE_TYPE.SOLAR}>公历</option>
                            <option value={ANNIVERSARY_DATE_TYPE.LUNAR}>农历</option>
                        </Select>
                    </div>

                    {dateType === ANNIVERSARY_DATE_TYPE.SOLAR && (
                        <div className="sm:col-span-3">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">日期（公历）</label>
                            <SmartDateInput type="date" name="solarDate" required className="h-12 bg-base/50" />
                        </div>
                    )}

                    {dateType === ANNIVERSARY_DATE_TYPE.LUNAR && (
                        <div className="sm:col-span-3">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">日期（选择公历日期，自动转换农历）</label>
                            <SmartDateInput type="date" name="solarDate" dateType={ANNIVERSARY_DATE_TYPE.LUNAR} required className="h-12 bg-base/50" />
                        </div>
                    )}
                </div>

                <fieldset className="rounded-xl border border-dashed border-default p-4">
                    <legend className="px-1 text-xs font-medium text-secondary">
                        提醒设置 <span className="text-muted font-normal">(默认 {dateReminderTime}, 时区 {timeZone})</span>
                    </legend>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {anniversaryReminderOptionsDays.map((opt) => (
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
        </form>
    );
}
