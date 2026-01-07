"use client";

"use client";

import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { Textarea } from "@/app/_components/Textarea";
import { createSubscription } from "@/app/_actions/subscriptions";

const reminderOptionsDays = [
    { days: 0, label: "到期日" },
    { days: 1, label: "提前 1 天" },
    { days: 3, label: "提前 3 天" },
    { days: 7, label: "提前 7 天" },
    { days: 30, label: "提前 30 天" },
] as const;

type SubscriptionCreateFormProps = {
    dateReminderTime: string;
    timeZone: string;
};

export function SubscriptionCreateForm({
    dateReminderTime,
    timeZone,
}: SubscriptionCreateFormProps) {
    return (
        <form action={createSubscription} className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
                <div className="w-full">
                    <label className="mb-1.5 block text-xs font-medium text-secondary">订阅名称</label>
                    <Input
                        name="name"
                        placeholder="新增订阅（如 Netflix / iCloud / 域名）"
                        className="h-12 bg-surface"
                        autoComplete="off"
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary">下次到期日</label>
                    <SmartDateInput type="date" name="nextRenewDate" required className="h-12 bg-base/50" />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary">周期单位</label>
                    <Select name="cycleUnit" defaultValue="month" className="h-12 bg-base/50">
                        <option value="month">月</option>
                        <option value="year">年</option>
                    </Select>
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary">周期间隔</label>
                    <Input type="number" name="cycleInterval" defaultValue={1} min={1} className="h-12 bg-base/50" />
                </div>
                <div>
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
                    <Select name="currency" defaultValue="CNY" className="h-12 bg-base/50">
                        <option value="CNY">CNY ¥</option>
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

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    className="h-11 rounded-lg bg-brand-primary px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-primary/90 hover:shadow-md active:scale-95"
                >
                    保存订阅
                </button>
            </div>
        </form>
    );
}
