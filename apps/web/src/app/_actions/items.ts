"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatDateString, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import { items, itemStatusValues, type ItemStatus } from "@/server/db/schema";

function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNonNegativeIntField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const raw = parseStringField(formData, key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return fallback;
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

function parseItemStatusField(formData: FormData, key: string): ItemStatus {
  const value = parseStringField(formData, key);
  if (value && itemStatusValues.includes(value as ItemStatus)) {
    return value as ItemStatus;
  }
  return "using";
}

function parseRedirectToField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function createItem(formData: FormData) {
  const name = parseStringField(formData, "name");
  if (!name) return;

  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const purchasedDate = parseDateField(formData, "purchasedDate");
  const category = parseStringField(formData, "category");
  const status = parseItemStatusField(formData, "status");
  const usageCount = parseNonNegativeIntField(formData, "usageCount", 0);
  const targetDailyCostCents = parsePriceCentsField(formData, "targetDailyCost");

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
    updatedAt: new Date(),
  });

  revalidatePath("/items");
}

export async function updateItem(formData: FormData) {
  const id = parseStringField(formData, "id");
  const name = parseStringField(formData, "name");
  if (!id || !name) return;

  const priceCents = parsePriceCentsField(formData, "price");
  const currency = parseCurrencyField(formData, "currency");
  const purchasedDate = parseDateField(formData, "purchasedDate");
  const category = parseStringField(formData, "category");
  const status = parseItemStatusField(formData, "status");
  const usageCount = parseNonNegativeIntField(formData, "usageCount", 0);
  const targetDailyCostCents = parsePriceCentsField(formData, "targetDailyCost");

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
      updatedAt: new Date(),
    })
    .where(eq(items.id, id));

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}?saved=1`);
}

export async function setItemStatus(formData: FormData) {
  const id = parseStringField(formData, "id");
  const status = parseItemStatusField(formData, "status");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  await db
    .update(items)
    .set({ status, updatedAt: new Date() })
    .where(eq(items.id, id));

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteItem(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  await db.delete(items).where(eq(items.id, id));

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  if (redirectTo) redirect(redirectTo);
}

