"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addMonthsClampedToDateString,
  formatDateString,
  getDatePartsInTimeZone,
  parseDateString,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import {
  subscriptionCycleUnitValues,
  subscriptions,
  type SubscriptionCycleUnit,
} from "@/server/db/schema";

function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanField(formData: FormData, key: string): boolean | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function parseNumberListField(formData: FormData, key: string): number[] {
  const values = formData.getAll(key);
  const parsed = new Set<number>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) continue;
    if (n < 0) continue;
    parsed.add(n);
  }

  return Array.from(parsed).sort((a, b) => a - b);
}

function parseCycleUnitField(formData: FormData, key: string): SubscriptionCycleUnit {
  const value = parseStringField(formData, key);
  if (value && subscriptionCycleUnitValues.includes(value as SubscriptionCycleUnit)) {
    return value as SubscriptionCycleUnit;
  }
  return "month";
}

function parsePositiveIntField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const value = parseStringField(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 1) return fallback;
  return parsed;
}

function parsePriceCentsField(formData: FormData, key: string): number | null {
  const raw = parseStringField(formData, key);
  if (!raw) return null;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  if (parsed > 1_000_000_000) return null;

  return Math.round(parsed * 100);
}

function parseCurrencyField(formData: FormData, key: string): string {
  return parseStringField(formData, key) ?? "CNY";
}

function parseDateField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  const parsed = parseDateString(value);
  if (!parsed) return null;
  return formatDateString(parsed);
}

function parseRedirectToField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function createSubscription(formData: FormData) {
  const name = parseStringField(formData, "name");
  const nextRenewDate = parseDateField(formData, "nextRenewDate");
  if (!name || !nextRenewDate) return;

  const description = parseStringField(formData, "description");
  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const cycleUnit = parseCycleUnitField(formData, "cycleUnit");
  const cycleInterval = Math.min(
    120,
    parsePositiveIntField(formData, "cycleInterval", 1),
  );
  const autoRenew = parseBooleanField(formData, "autoRenew") ?? true;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  await db.insert(subscriptions).values({
    id: randomUUID(),
    name,
    description,
    priceCents,
    currency,
    cycleUnit,
    cycleInterval,
    nextRenewDate,
    autoRenew,
    remindOffsetsDays: JSON.stringify(remindOffsetsDays),
    updatedAt: new Date(),
  });

  revalidatePath("/subscriptions");
}

export async function updateSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  const name = parseStringField(formData, "name");
  const nextRenewDate = parseDateField(formData, "nextRenewDate");
  if (!id || !name || !nextRenewDate) return;

  const description = parseStringField(formData, "description");
  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const cycleUnit = parseCycleUnitField(formData, "cycleUnit");
  const cycleInterval = Math.min(
    120,
    parsePositiveIntField(formData, "cycleInterval", 1),
  );
  const autoRenew = parseBooleanField(formData, "autoRenew") ?? true;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  await db
    .update(subscriptions)
    .set({
      name,
      description,
      priceCents,
      currency,
      cycleUnit,
      cycleInterval,
      nextRenewDate,
      autoRenew,
      remindOffsetsDays: JSON.stringify(remindOffsetsDays),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, id));

  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);
  redirect(`/subscriptions/${id}?saved=1`);
}

export async function setSubscriptionArchived(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isArchived = parseBooleanField(formData, "isArchived");
  if (!id || isArchived === null) return;

  await db
    .update(subscriptions)
    .set({
      isArchived,
      archivedAt: isArchived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, id));

  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);
}

export async function renewSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  const settings = await getAppSettings();
  const today = formatDateString(getDatePartsInTimeZone(new Date(), settings.timeZone));

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  const row = existing[0];
  if (!row) return;

  const baseDate =
    parseDateString(row.nextRenewDate) && parseDateString(today)
      ? row.nextRenewDate < today
        ? today
        : row.nextRenewDate
      : row.nextRenewDate;

  const monthsToAdd = row.cycleUnit === "year" ? row.cycleInterval * 12 : row.cycleInterval;
  const nextRenewDate = addMonthsClampedToDateString(baseDate, monthsToAdd);
  if (!nextRenewDate) return;

  await db
    .update(subscriptions)
    .set({ nextRenewDate, updatedAt: new Date() })
    .where(eq(subscriptions.id, id));

  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  await db.delete(subscriptions).where(eq(subscriptions.id, id));

  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);
  if (redirectTo) redirect(redirectTo);
}
