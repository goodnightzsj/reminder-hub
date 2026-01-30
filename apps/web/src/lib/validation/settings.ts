import { z } from "zod";
import { zfd } from "zod-form-data";
import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";

import { trimmedText } from "./common";

export const timeZoneSchema = zfd.formData({
  timeZone: trimmedText(z.string().refine(isValidTimeZone, { message: "Invalid timezone" })),
});

export const dateReminderTimeSchema = zfd.formData({
  dateReminderTime: trimmedText(z.string().refine(isValidTimeOfDay, { message: "Invalid time format (HH:mm)" })),
});
