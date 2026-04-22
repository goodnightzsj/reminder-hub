"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/server/db";
import { anniversaries } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import { BASE_TAGS_BY_DOMAIN, TAGS } from "@/lib/cache-tags";
import {
  anniversaryArchiveSchema,
  anniversaryCreateSchema,
  anniversaryIdSchema,
  anniversaryUpdateSchema,
} from "@/lib/validation/anniversary";
import { redirectFlashAction, redirectFlashError } from "./redirect-url";

const ANNIVERSARIES_PATH = ROUTES.anniversaries;

function revalidateAnniversaryDetailAndList(id: string) {
  revalidatePath(ANNIVERSARIES_PATH);
  revalidatePath(`${ANNIVERSARIES_PATH}/${id}`);
  // 失效缓存 tag：列表 + dashboard 聚合 + 单实体详情
  for (const tag of BASE_TAGS_BY_DOMAIN.anniversary) updateTag(tag);
  updateTag(TAGS.anniversary(id));
}

function revalidateAnniversaryListOnly() {
  revalidatePath(ANNIVERSARIES_PATH);
  for (const tag of BASE_TAGS_BY_DOMAIN.anniversary) updateTag(tag);
}

export async function createAnniversary(formData: FormData) {
  const result = anniversaryCreateSchema.safeParse(formData);
  
  if (!result.success) {
    redirectFlashError(ANNIVERSARIES_PATH);
  }
  const parsed = result.data;

  const now = new Date();

  await db.insert(anniversaries).values({
    id: randomUUID(),
    title: parsed.title,
    category: parsed.category,
    dateType: parsed.dateType as "solar" | "lunar",
    isLeapMonth: parsed.isLeapMonth,
    date: parsed.date,
    remindOffsetsDays: JSON.stringify(parsed.remindOffsetsDays),
    updatedAt: now,
  });

  revalidateAnniversaryListOnly();
}

export async function updateAnniversary(formData: FormData) {
  const result = anniversaryUpdateSchema.safeParse(formData);
  
  if (!result.success) {
      redirectFlashError(ANNIVERSARIES_PATH);
  }
  const parsed = result.data;
  const { id } = parsed;

  const now = new Date();

  await db
    .update(anniversaries)
    .set({
      title: parsed.title,
      category: parsed.category,
      dateType: parsed.dateType as "solar" | "lunar",
      isLeapMonth: parsed.isLeapMonth,
      date: parsed.date,
      remindOffsetsDays: JSON.stringify(parsed.remindOffsetsDays),
      updatedAt: now,
    })
    .where(eq(anniversaries.id, id));

  revalidateAnniversaryDetailAndList(id);
  redirectFlashAction(ANNIVERSARIES_PATH, "updated");
}


export async function setAnniversaryArchived(formData: FormData) {
  const result = anniversaryArchiveSchema.safeParse(formData);
  if (!result.success) return;
  const { id, isArchived } = result.data;

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
  const result = anniversaryIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;

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
  if (redirectTo) redirectFlashAction(redirectTo, "deleted");
}

export async function restoreAnniversary(formData: FormData) {
  const result = anniversaryIdSchema.safeParse(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;
  const now = new Date();

  await db
    .update(anniversaries)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(anniversaries.id, id));

  revalidateAnniversaryDetailAndList(id);

  if (redirectTo) redirectFlashAction(redirectTo, "restored");
}
