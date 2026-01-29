import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { ANNIVERSARY_DATE_TYPE, anniversaryDateTypeValues, canonicalizeAnniversaryCategory, DEFAULT_ANNIVERSARY_CATEGORY, DEFAULT_ANNIVERSARY_DATE_TYPE, type AnniversaryDateType } from "../anniversary";
import { parseMonthDayString } from "@/server/anniversary";
import { parseDateString, formatDateString } from "@/server/date";

function trimToUndefined(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}

function trimmedText<T extends z.ZodTypeAny>(schema: T) {
    return zfd.text(z.preprocess(trimToUndefined, schema));
}

function normalizeIntList(values: number[]): number[] {
    return Array.from(new Set(values)).sort((a, b) => a - b);
}

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

// Transformation chain
export const anniversaryUpsertSchema = zfd.formData({
    title: trimmedText(z.string()),
    category: trimmedText(z.string().transform(canonicalizeAnniversaryCategory).optional().default(DEFAULT_ANNIVERSARY_CATEGORY)),
    dateType: zfd.text(z.enum(anniversaryDateTypeValues as unknown as [string, ...string[]]).catch(DEFAULT_ANNIVERSARY_DATE_TYPE)),
    isLeapMonth: zfd.checkbox(),
    solarDate: trimmedText(z.string().optional()),
    lunarMonth: trimmedText(z.string().optional()),
    lunarDay: trimmedText(z.string().optional()),
    remindOffsetsDays: zfd.repeatable(z.array(zfd.numeric(z.number().int().min(0)))),
}).transform((data, ctx) => {
    let date = "";
    
    // reset isLeapMonth if not lunar
    const finalIsLeapMonth = data.dateType === ANNIVERSARY_DATE_TYPE.LUNAR ? data.isLeapMonth : false;

    if (data.dateType === ANNIVERSARY_DATE_TYPE.SOLAR) {
        if (!data.solarDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["solarDate"], message: "Missing solar date" });
            return z.NEVER;
        }
        const parsed = parseDateString(data.solarDate);
        if (!parsed) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["solarDate"], message: "Invalid date format" });
             return z.NEVER;
        }
        date = formatDateString(parsed);
    } else {
         if (!data.lunarMonth || !data.lunarDay) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lunarMonth"], message: "Missing lunar date" });
            return z.NEVER;
        }
        const parsed = parseMonthDayString(`${data.lunarMonth}-${data.lunarDay}`);
        if (!parsed) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lunarMonth"], message: "Invalid lunar date" });
            return z.NEVER;
        }
        date = `${pad2(parsed.month)}-${pad2(parsed.day)}`;
    }

    return {
        title: data.title,
        category: data.category,
        dateType: data.dateType as AnniversaryDateType,
        isLeapMonth: finalIsLeapMonth,
        date,
        remindOffsetsDays: normalizeIntList(data.remindOffsetsDays)
    };
});
