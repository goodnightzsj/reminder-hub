"use client";

import { useState } from "react";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { ANNIVERSARY_DATE_TYPE, isAnniversaryDateType, type AnniversaryDateType } from "@/lib/anniversary";

type AnniversaryDateFieldsProps = {
    defaultDateType: AnniversaryDateType;
    defaultSolarDate?: string;
    defaultLunarMonth?: number;
    defaultLunarDay?: number;
    defaultIsLeapMonth?: boolean;
};

/**
 * 纪念日日期编辑字段（客户端组件）
 * 统一使用日历组件选择日期，农历模式下自动转换
 */
export function AnniversaryDateFields({
    defaultDateType,
    defaultSolarDate,
    defaultLunarMonth,
    defaultLunarDay,
    defaultIsLeapMonth,
}: AnniversaryDateFieldsProps) {
    const [dateType, setDateType] = useState<AnniversaryDateType>(defaultDateType);

    // 如果是农历，需要计算对应的公历日期用于显示
    // 这里我们用 solarDate 字段，农历模式下让用户选择公历日期后自动转换
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
                    {dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? "日期（公历）" : "日期（选择公历日期，自动转换农历）"}
                </label>
                <SmartDateInput
                    name="solarDate"
                    dateType={dateType}
                    defaultValue={initialSolarDate}
                    className="h-10 bg-base/50"
                />
                {dateType === ANNIVERSARY_DATE_TYPE.LUNAR && defaultLunarMonth && defaultLunarDay && (
                    <p className="text-xs text-muted mt-1">
                        当前农历：{defaultIsLeapMonth ? "闰" : ""}{defaultLunarMonth}月{defaultLunarDay}日
                        （如需修改请重新选择公历日期）
                    </p>
                )}
            </div>
        </>
    );
}
