"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { anniversaries } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import type { FlashAction } from "@/lib/flash";
import { anniversaryUpsertSchema } from "@/lib/validation/anniversary";

import {
  parseBooleanField,
  parseRedirectToField,
  parseStringField,
} from "./form-data";
import { withAction } from "./redirect-url";

const ANNIVERSARIES_PATH = ROUTES.anniversaries;

function redirectWithAnniversaryAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

function revalidateAnniversaryDetailAndList(id: string) {
  revalidatePath(ANNIVERSARIES_PATH);
  revalidatePath(`${ANNIVERSARIES_PATH}/${id}`);
}

export async function createAnniversary(formData: FormData) {
  const result = anniversaryUpsertSchema.safeParse(formData);
  
  if (!result.success) {
    // In a real app we'd return errors, but matching existing behavior we just return
    console.error("Validation failed", result.error);
    return;
  }
  const parsed = result.data;

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

  const result = anniversaryUpsertSchema.safeParse(formData);
  if (!result.success) {
      console.error("Validation failed", result.error);
      return;
  }
  const parsed = result.data;

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
