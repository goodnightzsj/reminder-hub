import { z } from "zod";
import { zfd } from "zod-form-data";
import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";

import { looseCheckbox, trimmedText } from "./common";

export const timeZoneSchema = zfd.formData({
  timeZone: trimmedText(z.string().refine(isValidTimeZone, { message: "Invalid timezone" })),
});

export const dateReminderTimeSchema = zfd.formData({
  dateReminderTime: trimmedText(z.string().refine(isValidTimeOfDay, { message: "Invalid time format (HH:mm)" })),
});

export const internalSchedulerSettingsSchema = zfd.formData({
  internalSchedulerEnabled: looseCheckbox(),
  internalNotifyEnabled: looseCheckbox(),
  internalWeeklyDigestEnabled: looseCheckbox(),
  internalMonthlyDigestEnabled: looseCheckbox(),
  internalNotifyIntervalSeconds: trimmedText(z.string().optional()),
  internalDigestTime: trimmedText(z.string().optional()),
});
