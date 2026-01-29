
"use server";

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
import { dateReminderTimeSchema, timeZoneSchema } from "@/lib/validation/settings";
import { revalidatePaths } from "./revalidate";
import {
  SETTINGS_PATH,
  redirectSettingsDataCleared,
  redirectSettingsError,
  redirectSettingsSaved,
} from "./settings.utils";

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
  const result = await timeZoneSchema.safeParseAsync(formData);
  if (!result.success) {
      if (result.error.issues.some(i => i.path.includes("timeZone") && i.message === "Invalid timezone")) {
        redirectSettingsError("invalid-timezone");
      }
      redirectSettingsError("missing-timezone");
  }

  const { timeZone } = result.data;

  await setAppTimeZone(timeZone);
  revalidatePaths(SETTINGS_PATHS);
  redirectSettingsSaved();
}

export async function updateDateReminderTime(formData: FormData) {
  const result = await dateReminderTimeSchema.safeParseAsync(formData);
  
  if (!result.success) {
      if (result.error.issues.some(i => i.path.includes("dateReminderTime") && i.message.includes("Invalid time"))) {
          redirectSettingsError("invalid-date-reminder-time");
      }
      redirectSettingsError("missing-date-reminder-time");
  }
  
  const { dateReminderTime } = result.data;

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
