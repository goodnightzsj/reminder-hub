import "server-only";

import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { getAppTimeSettings } from "@/server/db/settings";
import {
  recurrenceUnits,
  type RecurrenceRule,
  type RecurrenceUnit,
} from "@/server/recurrence";
import { DEFAULT_TODO_PRIORITY, todoPriorityValues, type TodoPriority } from "@/lib/todo";

import { redirect } from "next/navigation";
import type { FlashAction } from "@/lib/flash";
import { withAction } from "./redirect-url";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export function redirectWithTodoAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.todo);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}

import {
  parseDateTimeLocalField,
  parseEnumField,
  parseNumberListField,
  parseOptionalEnumField,
  parsePositiveIntField,
  parseStringField,
} from "./form-data";

export function parseTodoPriorityField(formData: FormData, key: string): TodoPriority {
  return parseEnumField(formData, key, todoPriorityValues, DEFAULT_TODO_PRIORITY);
}

export function parseTagsField(formData: FormData, key: string): string[] {
  const value = parseStringField(formData, key);
  if (!value) return [];

  const tags = value
    .split(/[,\n，]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 20);

  return Array.from(new Set(tags));
}

function parseRecurrenceUnitField(
  formData: FormData,
  key: string,
): RecurrenceUnit | null {
  return parseOptionalEnumField(formData, key, recurrenceUnits);
}

export function parseRecurrenceRuleFields(
  formData: FormData,
  dueAt: Date | null,
): RecurrenceRule | null {
  const unit = parseRecurrenceUnitField(formData, "recurrenceUnit");
  if (!unit) return null;
  if (dueAt === null) return null;

  const interval = parsePositiveIntField(formData, "recurrenceInterval", 1);
  return { unit, interval };
}

export async function parseDueAtAndReminderOffsetsMinutes(
  formData: FormData,
): Promise<{ dueAt: Date | null; reminderOffsetsMinutes: number[] }> {
  const dueAtRaw = parseDateTimeLocalField(formData, "dueAt");
  const reminderOffsetsMinutesRaw = parseNumberListField(
    formData,
    "reminderOffsetsMinutes",
  );

  const { timeZone } = await getAppTimeSettings();
  const dueAt =
    dueAtRaw === null
      ? null
      : dateTimeLocalToUtcDate(dueAtRaw, timeZone);
  const reminderOffsetsMinutes =
    dueAt === null ? [] : reminderOffsetsMinutesRaw;

  return { dueAt, reminderOffsetsMinutes };
}
