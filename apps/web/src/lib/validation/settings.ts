import { z } from "zod";
import { zfd } from "zod-form-data";
import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";

function trimToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function trimmedText<T extends z.ZodTypeAny>(schema: T) {
  return zfd.text(z.preprocess(trimToUndefined, schema));
}

export const timeZoneSchema = zfd.formData({
  timeZone: trimmedText(z.string().refine(isValidTimeZone, { message: "Invalid timezone" })),
});

export const dateReminderTimeSchema = zfd.formData({
  dateReminderTime: trimmedText(z.string().refine(isValidTimeOfDay, { message: "Invalid time format (HH:mm)" })),
});
