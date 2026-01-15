"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { DEFAULT_ITEM_CATEGORY, DEFAULT_ITEM_STATUS, itemStatusValues, type ItemStatus } from "@/lib/items";
import { items } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import type { FlashAction } from "@/lib/flash";

import {
  parseEnumField,
  parseNonNegativeIntField,
  parseRedirectToField,
  parseStringField,
} from "./form-data";
import { parseCurrencyField, parseDateField, parsePriceCentsField } from "./form-fields";
import { withAction } from "./redirect-url";

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
  const name = parseStringField(formData, "name");
  if (!name) return;

  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const purchasedDate = parseDateField(formData, "purchasedDate");
  const category = parseStringField(formData, "category") || DEFAULT_ITEM_CATEGORY;
  const status = parseItemStatusField(formData, "status");
  const usageCount = parseNonNegativeIntField(formData, "usageCount", 0);
  const targetDailyCostCents = parsePriceCentsField(formData, "targetDailyCost");
  const now = new Date();

  await db.insert(items).values({
    id: randomUUID(),
    name,
    priceCents,
    currency,
    purchasedDate,
    category,
    status,
    usageCount,
    targetDailyCostCents,
    updatedAt: now,
  });

  revalidatePath(ITEMS_PATH);
}

export async function updateItem(formData: FormData) {
  const id = parseStringField(formData, "id");
  const name = parseStringField(formData, "name");
  if (!id || !name) return;

  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const purchasedDate = parseDateField(formData, "purchasedDate");
  const category = parseStringField(formData, "category") || DEFAULT_ITEM_CATEGORY;
  const status = parseItemStatusField(formData, "status");
  const usageCount = parseNonNegativeIntField(formData, "usageCount", 0);
  const targetDailyCostCents = parsePriceCentsField(formData, "targetDailyCost");
  const now = new Date();

  await db
    .update(items)
    .set({
      name,
      priceCents,
      currency,
      purchasedDate,
      category,
      status,
      usageCount,
      targetDailyCostCents,
      updatedAt: now,
    })
    .where(eq(items.id, id));

  revalidateItemDetailAndList(id);
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
