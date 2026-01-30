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
  SUBSCRIPTION_CYCLE_UNIT,
  type SubscriptionCycleUnit,
} from "@/lib/subscriptions";
import { subscriptions } from "@/server/db/schema";
import { getOrFetchServiceIcon } from "@/server/lib/icon-fetcher";
import { ROUTES } from "@/lib/routes";
import { FLASH_TOAST_QUERY_KEY, type FlashAction } from "@/lib/flash";

import {
  subscriptionArchiveSchema,
  subscriptionIdSchema,
  subscriptionUpsertSchema,
} from "@/lib/validation/subscription";
import { withAction, withSearchParams } from "./redirect-url";

const SUBSCRIPTIONS_PATH = ROUTES.subscriptions;

function redirectWithSubscriptionAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

function redirectWithSubscriptionError(path: string): never {
  redirect(withSearchParams(path, { [FLASH_TOAST_QUERY_KEY.ERROR]: "validation-failed" }));
}



function revalidateSubscriptionDetailAndList(id: string) {
  revalidatePath(SUBSCRIPTIONS_PATH);
  revalidatePath(`${SUBSCRIPTIONS_PATH}/${id}`);
}

export async function createSubscription(formData: FormData) {
  const result = await subscriptionUpsertSchema.safeParseAsync(formData);
  if (!result.success) redirectWithSubscriptionError(SUBSCRIPTIONS_PATH);
  const data = result.data;

  // Ensure icon is available in shared service_icons table
  await getOrFetchServiceIcon(data.name);

  const now = new Date();

  await db.insert(subscriptions).values({
    id: randomUUID(),
    name: data.name,
    category: data.category,
    description: data.description,
    priceCents: data.priceCents,
    currency: data.currency,
    cycleUnit: data.cycleUnit as SubscriptionCycleUnit,
    cycleInterval: data.cycleInterval,
    nextRenewDate: data.nextRenewDate,
    autoRenew: data.autoRenew,
    remindOffsetsDays: JSON.stringify(data.remindOffsetsDays),
    updatedAt: now,
  });

  revalidatePath(SUBSCRIPTIONS_PATH);
}

export async function updateSubscription(formData: FormData) {
    const result = await subscriptionUpsertSchema.safeParseAsync(formData);
    if (!result.success) redirectWithSubscriptionError(SUBSCRIPTIONS_PATH);
    const data = result.data;

    if (!data.id) return;

  // Ensure icon update if name changed or just in case
  await getOrFetchServiceIcon(data.name);
  const now = new Date();

  await db
    .update(subscriptions)
    .set({
      name: data.name,
      category: data.category,
      description: data.description,
      priceCents: data.priceCents,
      currency: data.currency,
      cycleUnit: data.cycleUnit as SubscriptionCycleUnit,
      cycleInterval: data.cycleInterval,
      nextRenewDate: data.nextRenewDate,
      autoRenew: data.autoRenew,
      remindOffsetsDays: JSON.stringify(data.remindOffsetsDays),
      updatedAt: now,
    })
    .where(eq(subscriptions.id, data.id));

  revalidateSubscriptionDetailAndList(data.id);
  redirectWithSubscriptionAction(SUBSCRIPTIONS_PATH, "updated");
}

export async function setSubscriptionArchived(formData: FormData) {
  const result = subscriptionArchiveSchema.safeParse(formData);
  if (!result.success) return;
  const { id, isArchived } = result.data;

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
  const result = subscriptionIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;

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
  const result = subscriptionIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;

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
  const result = subscriptionIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;
  const now = new Date();

  await db
    .update(subscriptions)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(subscriptions.id, id));

  revalidateSubscriptionDetailAndList(id);

  if (redirectTo) redirectWithSubscriptionAction(redirectTo, "restored");
}
