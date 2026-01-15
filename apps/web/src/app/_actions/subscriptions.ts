"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addMonthsClampedToDateString,
  formatDateInTimeZone,
  parseDateString,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  DEFAULT_SUBSCRIPTION_CYCLE_UNIT,
  SUBSCRIPTION_CYCLE_UNIT,
  subscriptionCycleUnitValues,
  type SubscriptionCycleUnit,
} from "@/lib/subscriptions";
import { subscriptions } from "@/server/db/schema";
import { getOrFetchServiceIcon } from "@/server/lib/icon-fetcher";
import { ROUTES } from "@/lib/routes";
import type { FlashAction } from "@/lib/flash";

import {
  parseBooleanField,
  parseEnumField,
  parseNumberListField,
  parsePositiveIntField,
  parseRedirectToField,
  parseStringField,
} from "./form-data";
import { parseCurrencyField, parseDateField, parsePriceCentsField } from "./form-fields";
import { withAction } from "./redirect-url";

const SUBSCRIPTIONS_PATH = ROUTES.subscriptions;

function redirectWithSubscriptionAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

function parseCycleUnitField(formData: FormData, key: string): SubscriptionCycleUnit {
  return parseEnumField(formData, key, subscriptionCycleUnitValues, DEFAULT_SUBSCRIPTION_CYCLE_UNIT);
}

function revalidateSubscriptionDetailAndList(id: string) {
  revalidatePath(SUBSCRIPTIONS_PATH);
  revalidatePath(`${SUBSCRIPTIONS_PATH}/${id}`);
}

export async function createSubscription(formData: FormData) {
  const name = parseStringField(formData, "name");
  const category = parseStringField(formData, "category") || DEFAULT_SUBSCRIPTION_CATEGORY;
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
  const autoRenew = parseBooleanField(formData, "autoRenew") ?? false;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  // Ensure icon is available in shared service_icons table
  await getOrFetchServiceIcon(name);

  // We no longer write to subscription.icon/color directly, logic is moved to service_icons
  // But we pass null to be explicit or let DB default handle it (nullable)
  const now = new Date();

  await db.insert(subscriptions).values({
    id: randomUUID(),
    name,
    category,
    description,
    priceCents,
    currency,
    cycleUnit,
    cycleInterval,
    nextRenewDate,
    autoRenew,
    remindOffsetsDays: JSON.stringify(remindOffsetsDays),
    // icon: null, // Legacy
    // color: null, // Legacy
    updatedAt: now,
  });

  revalidatePath(SUBSCRIPTIONS_PATH);
}

export async function updateSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  const name = parseStringField(formData, "name");
  const category = parseStringField(formData, "category") || DEFAULT_SUBSCRIPTION_CATEGORY;
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
  const autoRenew = parseBooleanField(formData, "autoRenew") ?? false;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  // Ensure icon update if name changed or just in case
  await getOrFetchServiceIcon(name);
  const now = new Date();

  await db
    .update(subscriptions)
    .set({
      name,
      category,
      description,
      priceCents,
      currency,
      cycleUnit,
      cycleInterval,
      nextRenewDate,
      autoRenew,
      remindOffsetsDays: JSON.stringify(remindOffsetsDays),
      updatedAt: now,
    })
    .where(eq(subscriptions.id, id));

  revalidateSubscriptionDetailAndList(id);
  redirectWithSubscriptionAction(SUBSCRIPTIONS_PATH, "updated");
}

export async function setSubscriptionArchived(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isArchived = parseBooleanField(formData, "isArchived");
  if (!id || isArchived === null) return;

  const now = new Date();
  await db
    .update(subscriptions)
    .set({
      isArchived,
      archivedAt: isArchived ? now : null,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, id));

  revalidateSubscriptionDetailAndList(id);
}

export async function renewSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  const { timeZone } = await getAppTimeSettings();
  const now = new Date();
  const today = formatDateInTimeZone(now, timeZone);

  const row = await db
    .select({
      nextRenewDate: subscriptions.nextRenewDate,
      cycleUnit: subscriptions.cycleUnit,
      cycleInterval: subscriptions.cycleInterval,
    })
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .get();
  if (!row) return;

  let baseDate = row.nextRenewDate;
  const nextRenewDateParsed = parseDateString(row.nextRenewDate);
  const todayParsed = parseDateString(today);
  if (nextRenewDateParsed && todayParsed && row.nextRenewDate < today) {
    baseDate = today;
  }

  const monthsToAdd =
    row.cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? row.cycleInterval * 12 : row.cycleInterval;
  const nextRenewDate = addMonthsClampedToDateString(baseDate, monthsToAdd);
  if (!nextRenewDate) return;

  await db
    .update(subscriptions)
    .set({ nextRenewDate, updatedAt: now })
    .where(eq(subscriptions.id, id));

  revalidateSubscriptionDetailAndList(id);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  const existing = await db
    .select({ deletedAt: subscriptions.deletedAt })
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .get();
  if (!existing) return;

  const now = new Date();
  if (existing.deletedAt) {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  } else {
    await db
      .update(subscriptions)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(subscriptions.id, id));
  }

  revalidateSubscriptionDetailAndList(id);
  if (redirectTo) redirectWithSubscriptionAction(redirectTo, "deleted");
}

export async function restoreSubscription(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;
  const redirectTo = parseRedirectToField(formData, "redirectTo");
  const now = new Date();

  await db
    .update(subscriptions)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(subscriptions.id, id));

  revalidateSubscriptionDetailAndList(id);

  if (redirectTo) redirectWithSubscriptionAction(redirectTo, "restored");
}
