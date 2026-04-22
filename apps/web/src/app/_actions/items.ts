"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { type ItemStatus } from "@/lib/items";
import { items } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import { BASE_TAGS_BY_DOMAIN, TAGS } from "@/lib/cache-tags";

import {
  itemIdSchema,
  itemStatusSchema,
  itemUpsertSchema,
} from "@/lib/validation/item";
import { redirectFlashAction, redirectFlashError } from "./redirect-url";

const ITEMS_PATH = ROUTES.items;

function revalidateItemDetailAndList(id: string) {
  revalidatePath(ITEMS_PATH);
  revalidatePath(`${ITEMS_PATH}/${id}`);
  for (const tag of BASE_TAGS_BY_DOMAIN.item) updateTag(tag);
  updateTag(TAGS.item(id));
}

function revalidateItemListOnly() {
  revalidatePath(ITEMS_PATH);
  for (const tag of BASE_TAGS_BY_DOMAIN.item) updateTag(tag);
}

export async function createItem(formData: FormData) {
  const result = await itemUpsertSchema.safeParseAsync(formData);
  if (!result.success) redirectFlashError(ITEMS_PATH);
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

  revalidateItemListOnly();
}

export async function updateItem(formData: FormData) {
  const result = await itemUpsertSchema.safeParseAsync(formData);
  if (!result.success) redirectFlashError(ITEMS_PATH);
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
  redirectFlashAction(ITEMS_PATH, "updated");
}

export async function setItemStatus(formData: FormData) {
  const result = itemStatusSchema.safeParse(formData);
  if (!result.success) return;
  const { id, status, redirectTo } = result.data;

  const now = new Date();

  await db
    .update(items)
    .set({ status: status as ItemStatus, updatedAt: now })
    .where(eq(items.id, id));

  revalidateItemDetailAndList(id);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteItem(formData: FormData) {
  const result = itemIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;

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

  if (redirectTo) redirectFlashAction(redirectTo, "deleted");
}

export async function restoreItem(formData: FormData) {
  const result = itemIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;
  const now = new Date();

  await db
    .update(items)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(items.id, id));

  revalidateItemDetailAndList(id);

  if (redirectTo) redirectFlashAction(redirectTo, "restored");
}
