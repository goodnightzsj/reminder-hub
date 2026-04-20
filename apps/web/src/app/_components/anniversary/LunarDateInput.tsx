"use client";

import { useMemo, useState } from "react";
import { Select } from "@/app/_components/ui/Select";
import { hasLeapMonth } from "@/lib/lunar-utils";

type LunarDateInputProps = {
    defaultLunarMonth?: number;
    defaultLunarDay?: number;
    defaultIsLeapMonth?: boolean;
    className?: string;
};

const LUNAR_MONTH_LABELS = [
    "正月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "冬月", "腊月",
];

const LUNAR_DAY_LABELS: string[] = (() => {
    const prefixes = ["初", "十", "廿", "三十"];
    const digits = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    const out: string[] = [];
    for (let d = 1; d <= 30; d++) {
        if (d <= 10) out.push(prefixes[0] + digits[d - 1]);
        else if (d < 20) out.push(prefixes[1] + (d === 10 ? "" : digits[d - 10 - 1]));
        else if (d === 20) out.push("二十");
        else if (d < 30) out.push(prefixes[2] + digits[d - 20 - 1]);
        else out.push(prefixes[3]);
    }
    return out;
})();

// 每月最大日：农历大月 30，小月 29；这里宽松给 30，让服务端兜底校验。
const MAX_LUNAR_DAY = 30;

/**
 * 纯农历日期选择器：仅依赖 农历月/日/闰月 ，与公历年份解耦
 * 提交字段：lunarMonth / lunarDay / isLeapMonth
 */
export function LunarDateInput({
    defaultLunarMonth,
    defaultLunarDay,
    defaultIsLeapMonth,
    className = "",
}: LunarDateInputProps) {
    const [month, setMonth] = useState<number>(defaultLunarMonth ?? 1);
    const [day, setDay] = useState<number>(defaultLunarDay ?? 1);
    const [isLeap, setIsLeap] = useState<boolean>(Boolean(defaultIsLeapMonth));

    // 任意公历年份内某个农历月是否可能出现闰月（跨全年检测）
    const leapAvailable = useMemo(() => {
        // lunar-javascript 的闰月判断依赖历年数据；这里简单暴露开关，
        // 由服务端最终校验（lunarToSolar 失败则回退提示）。
        const current = new Date().getFullYear();
        for (let y = current - 2; y <= current + 2; y++) {
            if (hasLeapMonth(y, month)) return true;
        }
        return true; // 始终允许勾选；若该年份不存在闰月，服务端校验会给出错误
    }, [month]);

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <Select
                name="lunarMonth"
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 w-[110px] bg-base/50"
            >
                {LUNAR_MONTH_LABELS.map((label, idx) => (
                    <option key={label} value={String(idx + 1)}>
                        {label}（{idx + 1}月）
                    </option>
                ))}
            </Select>

            <Select
                name="lunarDay"
                value={String(day)}
                onChange={(e) => setDay(Number(e.target.value))}
                className="h-10 w-[110px] bg-base/50"
            >
                {Array.from({ length: MAX_LUNAR_DAY }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                        {LUNAR_DAY_LABELS[d - 1]}（{d}日）
                    </option>
                ))}
            </Select>

            <label
                className={`inline-flex items-center gap-1.5 text-xs select-none px-2.5 h-10 rounded-lg border border-default bg-base/50 cursor-pointer transition-colors ${
                    isLeap ? "text-brand-primary border-brand-primary/40 bg-brand-primary/5" : "text-secondary"
                } ${leapAvailable ? "" : "opacity-60"}`}
                title="仅在该农历月存在闰月时生效"
            >
                <input
                    type="checkbox"
                    name="isLeapMonth"
                    value="1"
                    checked={isLeap}
                    onChange={(e) => setIsLeap(e.target.checked)}
                />
                闰月
            </label>
        </div>
    );
}
