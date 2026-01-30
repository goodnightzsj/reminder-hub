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

import { normalizeIntList, safeRedirectTo, trimmedText, looseCheckbox } from "./common";

function parsePriceCents(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  if (parsed > 1_000_000_000) return null;
  return Math.round(parsed * 100);
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
  cycleInterval: zfd.numeric(z.number().int().min(1).max(120).catch(1)),
  nextRenewDate: trimmedText(z.string()),
  autoRenew: looseCheckbox(),
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

export const subscriptionIdSchema = zfd.formData({
  id: trimmedText(z.string()),
  isArchived: looseCheckbox(),
  redirectTo: trimmedText(z.string().optional().transform(safeRedirectTo)),
});

export const subscriptionArchiveSchema = zfd.formData({
  id: trimmedText(z.string()),
  isArchived: looseCheckbox(),
});
