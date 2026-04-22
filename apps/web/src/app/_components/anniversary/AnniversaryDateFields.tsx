"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { ANNIVERSARY_DATE_TYPE, isAnniversaryDateType, type AnniversaryDateType } from "@/lib/anniversary";

// 农历输入会引入 lunar-javascript，只有用户切到"农历"时才需要 — 延迟加载
const LunarDateInput = dynamic(
    () => import("./LunarDateInput").then((m) => ({ default: m.LunarDateInput })),
    {
        ssr: false,
        loading: () => (
            <div className="h-12 w-full rounded-lg border border-default bg-surface/30 animate-pulse" />
        ),
    }
);

type AnniversaryDateFieldsProps = {
    defaultDateType: AnniversaryDateType;
    defaultSolarDate?: string;
    defaultLunarMonth?: number;
    defaultLunarDay?: number;
    defaultIsLeapMonth?: boolean;
};

/**
 * 纪念日日期编辑字段（客户端组件）
 * - 公历：SmartDateInput 选择 YYYY-MM-DD
 * - 农历：直接选择 农历月 / 农历日 / 闰月，与公历年份解耦
 */
export function AnniversaryDateFields({
    defaultDateType,
    defaultSolarDate,
    defaultLunarMonth,
    defaultLunarDay,
    defaultIsLeapMonth,
}: AnniversaryDateFieldsProps) {
    const [dateType, setDateType] = useState<AnniversaryDateType>(defaultDateType);

    const initialSolarDate =
        defaultDateType === ANNIVERSARY_DATE_TYPE.SOLAR ? defaultSolarDate : "";

    return (
        <>
            <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">日期类型</label>
                <Select
                    name="dateType"
                    value={dateType}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (isAnniversaryDateType(value)) setDateType(value);
                    }}
                    className="h-10 bg-base/50"
                >
                    <option value={ANNIVERSARY_DATE_TYPE.SOLAR}>公历</option>
                    <option value={ANNIVERSARY_DATE_TYPE.LUNAR}>农历</option>
                </Select>
            </div>

            <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-secondary mb-1.5">
                    {dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? "日期（公历）" : "日期（农历 · 不限年份，每年自动提醒）"}
                </label>
                {dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? (
                    <SmartDateInput
                        name="solarDate"
                        dateType={dateType}
                        defaultValue={initialSolarDate}
                        className="h-10 bg-base/50"
                    />
                ) : (
                    <LunarDateInput
                        defaultLunarMonth={defaultLunarMonth}
                        defaultLunarDay={defaultLunarDay}
                        defaultIsLeapMonth={defaultIsLeapMonth}
                    />
                )}
            </div>
        </>
    );
}
