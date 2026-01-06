"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatDateString, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import {
  anniversaries,
  anniversaryCategoryValues,
  anniversaryDateTypeValues,
  type AnniversaryCategory,
  type AnniversaryDateType,
} from "@/server/db/schema";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

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

function parseCategoryField(formData: FormData, key: string): AnniversaryCategory {
  const value = parseStringField(formData, key);
  if (value && anniversaryCategoryValues.includes(value as AnniversaryCategory)) {
    return value as AnniversaryCategory;
  }
  return "anniversary";
}

function parseDateTypeField(formData: FormData, key: string): AnniversaryDateType {
  const value = parseStringField(formData, key);
  if (value && anniversaryDateTypeValues.includes(value as AnniversaryDateType)) {
    return value as AnniversaryDateType;
  }
  return "solar";
}

function parseSolarDateField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  const parsed = parseDateString(value);
  if (!parsed) return null;
  return formatDateString(parsed);
}

function parseLunarMonthDayFields(formData: FormData): string | null {
  const monthRaw = parseStringField(formData, "lunarMonth");
  const dayRaw = parseStringField(formData, "lunarDay");
  if (!monthRaw || !dayRaw) return null;

  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 30) return null;

  return `${pad2(month)}-${pad2(day)}`;
}

function parseRedirectToField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function createAnniversary(formData: FormData) {
  const title = parseStringField(formData, "title");
  if (!title) return;

  const category = parseCategoryField(formData, "category");
  const dateType = parseDateTypeField(formData, "dateType");
  const isLeapMonth = parseBooleanField(formData, "isLeapMonth") ?? false;
  const date =
    dateType === "lunar"
      ? parseLunarMonthDayFields(formData)
      : parseSolarDateField(formData, "solarDate");
  if (!date) return;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  await db.insert(anniversaries).values({
    id: randomUUID(),
    title,
    category,
    dateType,
    isLeapMonth: dateType === "lunar" ? isLeapMonth : false,
    date,
    remindOffsetsDays: JSON.stringify(remindOffsetsDays),
    updatedAt: new Date(),
  });

  revalidatePath("/anniversaries");
}

export async function updateAnniversary(formData: FormData) {
  const id = parseStringField(formData, "id");
  const title = parseStringField(formData, "title");
  if (!id || !title) return;

  const category = parseCategoryField(formData, "category");
  const dateType = parseDateTypeField(formData, "dateType");
  const isLeapMonth = parseBooleanField(formData, "isLeapMonth") ?? false;
  const date =
    dateType === "lunar"
      ? parseLunarMonthDayFields(formData)
      : parseSolarDateField(formData, "solarDate");
  if (!date) return;
  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  await db
    .update(anniversaries)
    .set({
      title,
      category,
      dateType,
      isLeapMonth: dateType === "lunar" ? isLeapMonth : false,
      date,
      remindOffsetsDays: JSON.stringify(remindOffsetsDays),
      updatedAt: new Date(),
    })
    .where(eq(anniversaries.id, id));

  revalidatePath("/anniversaries");
  revalidatePath(`/anniversaries/${id}`);
  redirect(`/anniversaries/${id}?saved=1`);
}

export async function setAnniversaryArchived(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isArchived = parseBooleanField(formData, "isArchived");
  if (!id || isArchived === null) return;

  await db
    .update(anniversaries)
    .set({
      isArchived,
      archivedAt: isArchived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(anniversaries.id, id));

  revalidatePath("/anniversaries");
  revalidatePath(`/anniversaries/${id}`);
}

export async function deleteAnniversary(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  await db.delete(anniversaries).where(eq(anniversaries.id, id));

  revalidatePath("/anniversaries");
  revalidatePath(`/anniversaries/${id}`);
  if (redirectTo) redirect(redirectTo);
}
