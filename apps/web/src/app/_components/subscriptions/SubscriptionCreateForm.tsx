"use client";

import { useState, useRef } from "react";
import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { createSubscription } from "@/app/_actions/subscriptions";
import { Icons } from "@/app/_components/Icons";
import { useToast } from "@/app/_components/Toast";
import { useConfetti } from "@/app/_components/ConfettiProvider";
import { useTimeouts } from "@/app/_components/useTimeouts";
import { useCreateModal } from "@/app/_components/useCreateModal";
import { DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE, runCreateFormSuccess } from "@/app/_components/create-form.utils";
import { subscriptionReminderOptionsDays } from "@/lib/reminder-options";
import { DEFAULT_SUBSCRIPTION_CYCLE_UNIT, subscriptionCategoryOptions, subscriptionCycleUnitOptions } from "@/lib/subscriptions";
import { DEFAULT_CURRENCY } from "@/lib/currency";

type SubscriptionCreateFormProps = {
    dateReminderTime: string;
    timeZone: string;
    className?: string;
};

export function SubscriptionCreateForm({
    dateReminderTime,
    timeZone,
    className = "",
}: SubscriptionCreateFormProps) {
    const { closeIfOpen } = useCreateModal();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);
    const { success, error: toastError } = useToast();
    const { triggerMicroConfetti } = useConfetti();
    const { scheduleTimeout } = useTimeouts();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setIsError(false);
        try {
            await createSubscription(formData);

            runCreateFormSuccess({
                setIsSuccess,
                toastSuccess: success,
                setFormKey,
                formRef,
                scheduleTimeout,
                closeCreateModalIfOpen: closeIfOpen,
            });

            // Trigger confetti at submit button position
            if (submitButtonRef.current) {
                const rect = submitButtonRef.current.getBoundingClientRect();
                triggerMicroConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
        } catch (err) {
            console.error(err);
            toastError(DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE);
            setIsError(true);
            scheduleTimeout(() => setIsError(false), 500);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className={`flex flex-col gap-5 ${className}`}>
            <div key={formKey} className="contents">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex-1">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">订阅名称</label>
                            <Input
                                name="name"
                                placeholder="新增订阅（如 Netflix / iCloud / 域名）"
                                className="h-12 bg-surface"
                                autoComplete="off"
                                required
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">分类</label>
                            <CustomSelect
                                name="category"
                                placeholder="输入自定义..."
                                className="h-12 bg-surface"
                                options={subscriptionCategoryOptions}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">下次到期日</label>
                            <SmartDateInput type="date" name="nextRenewDate" required className="h-12 bg-base/50" />
                        </div>
                        <div className="w-32">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">周期单位</label>
                            <Select
                                name="cycleUnit"
                                defaultValue={DEFAULT_SUBSCRIPTION_CYCLE_UNIT}
                                className="h-12 bg-base/50"
                            >
                                {subscriptionCycleUnitOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="w-32">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">周期间隔</label>
                            <Input type="number" name="cycleInterval" defaultValue={1} min={1} className="h-12 bg-base/50" />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="mb-1.5 block text-xs font-medium text-secondary">自动续费</label>
                            <div className="flex h-12 items-center rounded-lg border border-default bg-surface px-3">
                                <input
                                    type="checkbox"
                                    name="autoRenew"
                                    value="1"
                                    defaultChecked
                                    className="h-5 w-5 rounded border-default text-brand-primary focus:ring-brand-primary/20 bg-transparent"
                                />
                                <span className="ml-3 text-sm text-primary">是</span>
                            </div>
                        </div>
                    </div>
                </div>

                <fieldset className="rounded-xl border border-dashed border-default p-4">
                    <legend className="px-1 text-xs font-medium text-secondary">
                        提醒设置 <span className="text-muted font-normal">(默认 {dateReminderTime}, 时区 {timeZone})</span>
                    </legend>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {subscriptionReminderOptionsDays.map((opt) => (
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

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-secondary">金额</label>
                        <Input
                            type="number"
                            name="price"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-12 bg-surface"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-secondary">币种</label>
                        <Select
                            name="currency"
                            defaultValue={DEFAULT_CURRENCY}
                            className="h-12 bg-base/50"
                        >
                            <option value={DEFAULT_CURRENCY}>CNY ¥</option>
                            <option value="USD">USD $</option>
                            <option value="EUR">EUR €</option>
                            <option value="GBP">GBP £</option>
                            <option value="JPY">JPY ¥</option>
                            <option value="HKD">HKD $</option>
                            <option value="TWD">TWD $</option>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-secondary">备注</label>
                        <Input name="description" placeholder="可选备注" className="h-12 bg-base/50" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    ref={submitButtonRef}
                    type="submit"
                    className={`h-11 rounded-lg px-8 text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center justify-center min-w-[8rem] ${isSuccess
                        ? "bg-success text-white hover:bg-success"
                        : isError
                            ? "bg-destructive text-white animate-shake"
                            : "bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-md"
                        }`}
                    disabled={isSuccess || isLoading}
                >
                    {isSuccess ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            <Icons.Check className="h-5 w-5" />
                            <span>已保存</span>
                        </div>
                    ) : isLoading ? (
                        <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        "保存订阅"
                    )}
                </button>
            </div>
        </form>
    );
}
