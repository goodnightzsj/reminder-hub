import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { ANNIVERSARY_DATE_TYPE, anniversaryDateTypeValues, canonicalizeAnniversaryCategory, DEFAULT_ANNIVERSARY_CATEGORY, DEFAULT_ANNIVERSARY_DATE_TYPE } from "../anniversary";
import { parseMonthDayString } from "@/server/anniversary";
import { parseDateString, formatDateString } from "@/server/date";

import { normalizeIntList, safeRedirectTo, trimmedText, looseCheckbox } from "./common";

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

// Transformation chain
const anniversaryBaseShape = {
    title: trimmedText(z.string()),
    category: trimmedText(z.string().transform(canonicalizeAnniversaryCategory).optional().default(DEFAULT_ANNIVERSARY_CATEGORY)),
    dateType: zfd.text(z.enum(anniversaryDateTypeValues as unknown as [string, ...string[]]).catch(DEFAULT_ANNIVERSARY_DATE_TYPE)),
    isLeapMonth: looseCheckbox(),
    solarDate: trimmedText(z.string().optional()),
    lunarMonth: trimmedText(z.string().optional()),
    lunarDay: trimmedText(z.string().optional()),
    remindOffsetsDays: zfd.repeatable(z.array(zfd.numeric(z.number().int().min(0)))),
};

// Common transformer for both create and update
const anniversaryTransformer = (data: z.infer<z.ZodObject<typeof anniversaryBaseShape>>, ctx: z.RefinementCtx) => {
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
        ...data,
        isLeapMonth: finalIsLeapMonth,
        date,
        remindOffsetsDays: normalizeIntList(data.remindOffsetsDays)
    };
};

export const anniversaryCreateSchema = zfd.formData(anniversaryBaseShape).transform(anniversaryTransformer);

export const anniversaryUpdateSchema = zfd.formData({
    ...anniversaryBaseShape,
    id: trimmedText(z.string()),
}).transform((data, ctx) => {
    const { id, ...rest } = data;
    const transformed = anniversaryTransformer(rest, ctx);
    
    if (transformed === z.NEVER) return z.NEVER;
    
    return {
        id,
        ...transformed
    };
});

// Backward compatibility if needed, otherwise deprecate
export const anniversaryUpsertSchema = anniversaryCreateSchema;

export const anniversaryIdSchema = zfd.formData({
    id: trimmedText(z.string()),
    redirectTo: trimmedText(z.string().optional().transform(safeRedirectTo)),
});

export const anniversaryArchiveSchema = zfd.formData({
    id: trimmedText(z.string()),
    isArchived: looseCheckbox(),
});
