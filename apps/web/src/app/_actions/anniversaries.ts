"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseMonthDayString } from "@/server/anniversary";
import { formatDateString, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import {
  ANNIVERSARY_DATE_TYPE,
  DEFAULT_ANNIVERSARY_CATEGORY,
  DEFAULT_ANNIVERSARY_DATE_TYPE,
  anniversaryDateTypeValues,
  canonicalizeAnniversaryCategory,
  type AnniversaryCategory,
  type AnniversaryDateType,
} from "@/lib/anniversary";
import { anniversaries } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import type { FlashAction } from "@/lib/flash";

import {
  parseBooleanField,
  parseEnumField,
  parseNumberListField,
  parseRedirectToField,
  parseStringField,
} from "./form-data";
import { withAction } from "./redirect-url";

const ANNIVERSARIES_PATH = ROUTES.anniversaries;

function redirectWithAnniversaryAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseCategoryField(formData: FormData, key: string): AnniversaryCategory {
  const value = parseStringField(formData, key);
  if (value) {
    return canonicalizeAnniversaryCategory(value);
  }
  return DEFAULT_ANNIVERSARY_CATEGORY;
}

function parseDateTypeField(formData: FormData, key: string): AnniversaryDateType {
  return parseEnumField(formData, key, anniversaryDateTypeValues, DEFAULT_ANNIVERSARY_DATE_TYPE);
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

  const parsed = parseMonthDayString(`${monthRaw}-${dayRaw}`);
  if (!parsed) return null;

  return `${pad2(parsed.month)}-${pad2(parsed.day)}`;
}

function revalidateAnniversaryDetailAndList(id: string) {
  revalidatePath(ANNIVERSARIES_PATH);
  revalidatePath(`${ANNIVERSARIES_PATH}/${id}`);
}

type ParsedAnniversaryUpsertFields = {
  title: string;
  category: AnniversaryCategory;
  dateType: AnniversaryDateType;
  isLeapMonth: boolean;
  date: string;
  remindOffsetsDays: number[];
};

function parseAnniversaryUpsertFields(
  formData: FormData,
): ParsedAnniversaryUpsertFields | null {
  const title = parseStringField(formData, "title");
  if (!title) return null;

  const category = parseCategoryField(formData, "category");
  const dateType = parseDateTypeField(formData, "dateType");
  const isLeapMonth = parseBooleanField(formData, "isLeapMonth") ?? false;
  const date =
    dateType === ANNIVERSARY_DATE_TYPE.LUNAR
      ? parseLunarMonthDayFields(formData)
      : parseSolarDateField(formData, "solarDate");
  if (!date) return null;

  const remindOffsetsDays = parseNumberListField(formData, "remindOffsetsDays");

  return {
    title,
    category,
    dateType,
    isLeapMonth: dateType === ANNIVERSARY_DATE_TYPE.LUNAR ? isLeapMonth : false,
    date,
    remindOffsetsDays,
  };
}

export async function createAnniversary(formData: FormData) {
  const parsed = parseAnniversaryUpsertFields(formData);
  if (!parsed) return;

  const now = new Date();

  await db.insert(anniversaries).values({
    id: randomUUID(),
    title: parsed.title,
    category: parsed.category,
    dateType: parsed.dateType,
    isLeapMonth: parsed.isLeapMonth,
    date: parsed.date,
    remindOffsetsDays: JSON.stringify(parsed.remindOffsetsDays),
    updatedAt: now,
  });

  revalidatePath(ANNIVERSARIES_PATH);
}

export async function updateAnniversary(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const parsed = parseAnniversaryUpsertFields(formData);
  if (!parsed) return;

  const now = new Date();

  await db
    .update(anniversaries)
    .set({
      title: parsed.title,
      category: parsed.category,
      dateType: parsed.dateType,
      isLeapMonth: parsed.isLeapMonth,
      date: parsed.date,
      remindOffsetsDays: JSON.stringify(parsed.remindOffsetsDays),
      updatedAt: now,
    })
    .where(eq(anniversaries.id, id));

  revalidateAnniversaryDetailAndList(id);
  redirectWithAnniversaryAction(ANNIVERSARIES_PATH, "updated");
}

export async function setAnniversaryArchived(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isArchived = parseBooleanField(formData, "isArchived");
  if (!id || isArchived === null) return;

  const now = new Date();
  await db
    .update(anniversaries)
    .set({
      isArchived,
      archivedAt: isArchived ? now : null,
      updatedAt: now,
    })
    .where(eq(anniversaries.id, id));

  revalidateAnniversaryDetailAndList(id);
}

export async function deleteAnniversary(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;

  const redirectTo = parseRedirectToField(formData, "redirectTo");

  const existing = await db
    .select({ deletedAt: anniversaries.deletedAt })
    .from(anniversaries)
    .where(eq(anniversaries.id, id))
    .get();
  if (!existing) return;

  const now = new Date();
  if (existing.deletedAt) {
    await db.delete(anniversaries).where(eq(anniversaries.id, id));
  } else {
    await db
      .update(anniversaries)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(anniversaries.id, id));
  }

  revalidateAnniversaryDetailAndList(id);
  if (redirectTo) redirectWithAnniversaryAction(redirectTo, "deleted");
}

export async function restoreAnniversary(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;
  const redirectTo = parseRedirectToField(formData, "redirectTo");
  const now = new Date();

  await db
    .update(anniversaries)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(anniversaries.id, id));

  revalidateAnniversaryDetailAndList(id);

  if (redirectTo) redirectWithAnniversaryAction(redirectTo, "restored");
}
