"use client";

import { useState } from "react";
import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { createAnniversary } from "@/app/_actions/anniversaries";

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
};

export function AnniversaryCreateForm({
    dateReminderTime,
    timeZone,
}: AnniversaryCreateFormProps) {
    const [dateType, setDateType] = useState<"solar" | "lunar">("solar");

    return (
        <form action={createAnniversary} className="flex flex-col gap-5">
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
                    <Select name="category" defaultValue="anniversary" className="h-12 bg-base/50">
                        <option value="birthday">生日</option>
                        <option value="anniversary">纪念日</option>
                        <option value="festival">节日</option>
                        <option value="custom">自定义</option>
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
                    <>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">农历月</label>
                            <Select name="lunarMonth" defaultValue="1" className="h-12 bg-base/50">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">农历日</label>
                            <Select name="lunarDay" defaultValue="1" className="h-12 bg-base/50">
                                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">闰月</label>
                            <div className="flex h-12 items-center rounded-lg border border-default bg-surface px-3">
                                <input
                                    type="checkbox"
                                    name="isLeapMonth"
                                    value="1"
                                    className="h-5 w-5 rounded border-default text-brand-primary focus:ring-brand-primary/20 bg-transparent"
                                />
                                <span className="ml-3 text-sm text-primary">是</span>
                            </div>
                        </div>
                    </>
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

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    className="h-11 rounded-lg bg-brand-primary px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-primary/90 hover:shadow-md active:scale-95"
                >
                    保存纪念日
                </button>
            </div>
        </form>
    );
}
