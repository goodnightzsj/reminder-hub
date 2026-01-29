"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { DEFAULT_ITEM_STATUS, itemStatusValues, type ItemStatus } from "@/lib/items";
import { items } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import type { FlashAction } from "@/lib/flash";

import {
  parseEnumField,
  parseRedirectToField,
  parseStringField,
} from "./form-data";
import { withAction } from "./redirect-url";
import { itemUpsertSchema } from "@/lib/validation/item";

const ITEMS_PATH = ROUTES.items;

function redirectWithItemAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

function parseItemStatusField(formData: FormData, key: string): ItemStatus {
  return parseEnumField(formData, key, itemStatusValues, DEFAULT_ITEM_STATUS);
}

function revalidateItemDetailAndList(id: string) {
  revalidatePath(ITEMS_PATH);
  revalidatePath(`${ITEMS_PATH}/${id}`);
}

export async function createItem(formData: FormData) {
  const result = await itemUpsertSchema.safeParseAsync(formData);
  if (!result.success) return;
  const data = result.data;

  const now = new Date();

  await db.insert(items).values({
    id: randomUUID(),
    name: data.name,
    priceCents: data.priceCents,
    currency: data.currency,
    purchasedDate: data.purchasedDate,
    category: data.category,
    status: data.status as ItemStatus,
    usageCount: data.usageCount,
    targetDailyCostCents: data.targetDailyCostCents,
    updatedAt: now,
  });

  revalidatePath(ITEMS_PATH);
}

export async function updateItem(formData: FormData) {
  const result = await itemUpsertSchema.safeParseAsync(formData);
  if (!result.success) return;
  const data = result.data;

  if (!data.id) return;

  const now = new Date();

  await db
    .update(items)
    .set({
      name: data.name,
      priceCents: data.priceCents,
      currency: data.currency,
      purchasedDate: data.purchasedDate,
      category: data.category,
      status: data.status as ItemStatus,
      usageCount: data.usageCount,
      targetDailyCostCents: data.targetDailyCostCents,
      updatedAt: now,
    })
    .where(eq(items.id, data.id));

  revalidateItemDetailAndList(data.id);
  redirectWithItemAction(ITEMS_PATH, "updated");
}

export async function setItemStatus(formData: FormData) {
  const id = parseStringField(formData, "id");
  const status = parseItemStatusField(formData, "status");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");
  const now = new Date();

  await db
    .update(items)
    .set({ status, updatedAt: now })
    .where(eq(items.id, id));

  revalidateItemDetailAndList(id);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteItem(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  const existing = await db
    .select({ deletedAt: items.deletedAt })
    .from(items)
    .where(eq(items.id, id))
    .get();
  if (!existing) return;

  const now = new Date();
  if (existing.deletedAt) {
    await db.delete(items).where(eq(items.id, id));
  } else {
    await db
      .update(items)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(items.id, id));
  }

  revalidateItemDetailAndList(id);

  if (redirectTo) redirectWithItemAction(redirectTo, "deleted");
}

export async function restoreItem(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;
  const redirectTo = parseRedirectToField(formData, "redirectTo");
  const now = new Date();

  await db
    .update(items)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(items.id, id));

  revalidateItemDetailAndList(id);

  if (redirectTo) redirectWithItemAction(redirectTo, "restored");
}
