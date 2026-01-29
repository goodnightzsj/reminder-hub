import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { formatDateString, parseDateString } from "@/server/date";
import { DEFAULT_CURRENCY } from "../currency";
import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  DEFAULT_SUBSCRIPTION_CYCLE_UNIT,
  subscriptionCycleUnitValues,
} from "../subscriptions";

function trimToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function trimmedText<T extends z.ZodTypeAny>(schema: T) {
  return zfd.text(z.preprocess(trimToUndefined, schema));
}

function parsePriceCents(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  if (parsed > 1_000_000_000) return null;
  return Math.round(parsed * 100);
}

function normalizeIntList(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export const subscriptionUpsertSchema = zfd.formData({
  id: trimmedText(z.string().optional()),
  name: trimmedText(z.string()),
  category: trimmedText(z.string().optional().default(DEFAULT_SUBSCRIPTION_CATEGORY)),
  description: trimmedText(z.string().optional().default("")),
  price: trimmedText(z.string().optional()),
  currency: trimmedText(z.string().optional().default(DEFAULT_CURRENCY)),
  cycleUnit: zfd.text(
    z.enum(subscriptionCycleUnitValues as unknown as [string, ...string[]]).catch(DEFAULT_SUBSCRIPTION_CYCLE_UNIT)
  ),
  cycleInterval: zfd.numeric(z.number().int().positive().max(120).default(1)),
  nextRenewDate: trimmedText(z.string()),
  autoRenew: zfd.checkbox(),
  remindOffsetsDays: zfd.repeatable(z.array(zfd.numeric(z.number().int().min(0)))),
}).transform((data, ctx) => {
  const nextRenewDateParsed = parseDateString(data.nextRenewDate);
  if (!nextRenewDateParsed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nextRenewDate"], message: "Invalid date format" });
    return z.NEVER;
  }

  const nextRenewDate = formatDateString(nextRenewDateParsed);
  const priceCents = parsePriceCents(data.price);
  const remindOffsetsDays = normalizeIntList(data.remindOffsetsDays);

  return { ...data, nextRenewDate, priceCents, remindOffsetsDays };
});
