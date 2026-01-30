import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { formatDateString, parseDateString } from "@/server/date";
import { DEFAULT_CURRENCY } from "../currency";
import {
  DEFAULT_ITEM_CATEGORY,
  DEFAULT_ITEM_STATUS,
  itemStatusValues,
} from "../items";

import { safeRedirectTo, trimmedText } from "./common";

function parsePriceCents(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  if (parsed > 1_000_000_000) return null;
  return Math.round(parsed * 100);
}

function parseOptionalDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = parseDateString(value);
  if (!parsed) return null;
  return formatDateString(parsed);
}

export const itemUpsertSchema = zfd.formData({
  id: trimmedText(z.string().optional()),
  name: trimmedText(z.string()),
  price: trimmedText(z.string().optional()),
  currency: trimmedText(z.string().optional().default(DEFAULT_CURRENCY)),
  purchasedDate: trimmedText(z.string().optional()),
  category: trimmedText(z.string().optional().default(DEFAULT_ITEM_CATEGORY)),
  status: trimmedText(z.enum(itemStatusValues as unknown as [string, ...string[]]).catch(DEFAULT_ITEM_STATUS)),
  usageCount: zfd.numeric(z.number().int().min(0).catch(0)),
  targetDailyCost: trimmedText(z.string().optional()),
}).transform((data) => {
  const purchasedDate = parseOptionalDate(data.purchasedDate);
  const priceCents = parsePriceCents(data.price);
  const targetDailyCostCents = parsePriceCents(data.targetDailyCost);

  return { ...data, purchasedDate, priceCents, targetDailyCostCents };
});

export const itemIdSchema = zfd.formData({
  id: trimmedText(z.string()),
  redirectTo: trimmedText(z.string().optional().transform(safeRedirectTo)),
});

export const itemStatusSchema = zfd.formData({
  id: trimmedText(z.string()),
  status: trimmedText(z.enum(itemStatusValues as unknown as [string, ...string[]]).catch(DEFAULT_ITEM_STATUS)),
  redirectTo: trimmedText(z.string().optional().transform(safeRedirectTo)),
});
