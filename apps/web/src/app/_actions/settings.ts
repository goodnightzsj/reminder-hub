"use server";

import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";
import { db } from "@/server/db";
import { setAppDateReminderTime, setAppTimeZone } from "@/server/db/settings";
import {
  anniversaries,
  items,
  notificationDeliveries,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";

import { parseStringField } from "./form-data";
import {
  SETTINGS_PATH,
  redirectSettingsDataCleared,
  redirectSettingsError,
  redirectSettingsSaved,
} from "./settings.redirect";
import { revalidatePaths } from "./revalidate";

const SETTINGS_PATHS = [ROUTES.home, SETTINGS_PATH] as const;
const DATE_REMINDER_PATHS = [
  ROUTES.home,
  ROUTES.anniversaries,
  ROUTES.subscriptions,
  ROUTES.dashboard,
  SETTINGS_PATH,
] as const;
const CLEAR_ALL_DATA_PATHS = [
  ROUTES.home,
  ROUTES.anniversaries,
  ROUTES.subscriptions,
  ROUTES.items,
  ROUTES.dashboard,
  SETTINGS_PATH,
] as const;

export async function updateTimeZone(formData: FormData) {
  const timeZone = parseStringField(formData, "timeZone");
  if (!timeZone) redirectSettingsError("missing-timezone");
  if (!isValidTimeZone(timeZone)) redirectSettingsError("invalid-timezone");

  await setAppTimeZone(timeZone);
  revalidatePaths(SETTINGS_PATHS);
  redirectSettingsSaved();
}

export async function updateDateReminderTime(formData: FormData) {
  const dateReminderTime = parseStringField(formData, "dateReminderTime");
  if (!dateReminderTime) redirectSettingsError("missing-date-reminder-time");
  if (!isValidTimeOfDay(dateReminderTime)) redirectSettingsError("invalid-date-reminder-time");

  await setAppDateReminderTime(dateReminderTime);
  revalidatePaths(DATE_REMINDER_PATHS);
  redirectSettingsSaved();
}

export async function clearAllData() {
  db.transaction((tx) => {
    tx.delete(notificationDeliveries).run();
    tx.delete(todoSubtasks).run();
    tx.delete(todos).run();
    tx.delete(anniversaries).run();
    tx.delete(subscriptions).run();
    tx.delete(items).run();
  });

  revalidatePaths(CLEAR_ALL_DATA_PATHS);
  redirectSettingsDataCleared();
}
