"use client";

import { useMemo, useState } from "react";
import { Select } from "@/app/_components/ui/Select";
import { hasLeapMonth, lunarToSolar } from "@/lib/lunar-utils";

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

const MAX_LUNAR_DAY = 30;

function formatSolarPreview(ymd: string): string {
    const [y, m, d] = ymd.split("-");
    return `${y}年${Number(m)}月${Number(d)}日`;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE_START = CURRENT_YEAR - 80;
const YEAR_RANGE_END = CURRENT_YEAR + 20;

export function LunarDateInput({
    defaultLunarMonth,
    defaultLunarDay,
    defaultIsLeapMonth,
    className = "",
}: LunarDateInputProps) {
    const [month, setMonth] = useState<number>(defaultLunarMonth ?? 1);
    const [day, setDay] = useState<number>(defaultLunarDay ?? 1);
    const [isLeap, setIsLeap] = useState<boolean>(Boolean(defaultIsLeapMonth));
    const [year, setYear] = useState<number | null>(null);

    const leapAvailable = useMemo(() => {
        if (year) return hasLeapMonth(year, month);
        for (let y = CURRENT_YEAR - 2; y <= CURRENT_YEAR + 2; y++) {
            if (hasLeapMonth(y, month)) return true;
        }
        return true;
    }, [month, year]);

    const solarPreview = useMemo(() => {
        const results: { year: number; solar: string }[] = [];
        const years = year ? [year] : [CURRENT_YEAR, CURRENT_YEAR + 1];
        for (const y of years) {
            const s = lunarToSolar(y, month, day, isLeap);
            if (s) results.push({ year: y, solar: s });
        }
        return results;
    }, [month, day, isLeap, year]);

    return (
        <div className={className}>
            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={year ? String(year) : ""}
                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                    className="h-10 w-[88px] bg-base/50"
                    placeholder="不限年"
                >
                    <option value="">不限年</option>
                    {Array.from({ length: YEAR_RANGE_END - YEAR_RANGE_START + 1 }, (_, i) => YEAR_RANGE_END - i).map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                    ))}
                </Select>

                <Select
                    name="lunarMonth"
                    value={String(month)}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="h-10 w-[88px] bg-base/50"
                >
                    {LUNAR_MONTH_LABELS.map((label, idx) => (
                        <option key={label} value={String(idx + 1)}>
                            {label}
                        </option>
                    ))}
                </Select>

                <Select
                    name="lunarDay"
                    value={String(day)}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="h-10 w-[88px] bg-base/50"
                >
                    {Array.from({ length: MAX_LUNAR_DAY }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>
                            {LUNAR_DAY_LABELS[d - 1]}
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

            {solarPreview.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                    对应公历：{solarPreview.map((p, i) => (
                        <span key={p.year}>
                            {i > 0 && "，"}
                            {formatSolarPreview(p.solar)}
                        </span>
                    ))}
                </p>
            )}
        </div>
    );
}
