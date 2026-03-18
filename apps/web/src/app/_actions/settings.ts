
"use server";

import { db } from "@/server/db";
import { getAppSettings, setAppDateReminderTime, setAppTimeZone, SETTINGS_ID } from "@/server/db/settings";
import {
  anniversaries,
  appSettings,
  digestDeliveries,
  items,
  notificationDeliveries,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import { dateReminderTimeSchema, internalSchedulerSettingsSchema, timeZoneSchema } from "@/lib/validation/settings";
import { isValidTimeOfDay } from "@/server/datetime";
import { syncInternalScheduler } from "@/server/internal-scheduler";
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

export async function updateInternalSchedulerSettings(formData: FormData) {
  const result = await internalSchedulerSettingsSchema.safeParseAsync(formData);
  if (!result.success) {
    redirectSettingsError("validation-failed");
  }

  const parsed = result.data;

  const intervalRaw = parsed.internalNotifyIntervalSeconds;
  let intervalSeconds = 300;
  if (typeof intervalRaw === "string" && intervalRaw.length > 0) {
    if (!/^\d+$/.test(intervalRaw)) redirectSettingsError("invalid-internal-notify-interval");
    intervalSeconds = Number(intervalRaw);
    if (!Number.isFinite(intervalSeconds) || intervalSeconds < 60 || intervalSeconds > 86400) {
      redirectSettingsError("invalid-internal-notify-interval");
    }
    intervalSeconds = Math.floor(intervalSeconds);
  }

  const digestTime = parsed.internalDigestTime ?? "10:00";
  if (!isValidTimeOfDay(digestTime)) {
    redirectSettingsError("invalid-internal-digest-time");
  }

  const existing = await getAppSettings();
  const now = new Date();

  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone: existing.timeZone,
      dateReminderTime: existing.dateReminderTime,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        internalSchedulerEnabled: parsed.internalSchedulerEnabled,
        internalNotifyEnabled: parsed.internalNotifyEnabled,
        internalNotifyIntervalSeconds: intervalSeconds,
        internalWeeklyDigestEnabled: parsed.internalWeeklyDigestEnabled,
        internalMonthlyDigestEnabled: parsed.internalMonthlyDigestEnabled,
        internalDigestTime: digestTime,
        updatedAt: now,
      },
    });

  await syncInternalScheduler();
  revalidatePaths([SETTINGS_PATH]);
  redirectSettingsSaved();
}

export async function clearAllData() {
  db.transaction((tx) => {
    tx.delete(notificationDeliveries).run();
    tx.delete(digestDeliveries).run();
    tx.delete(todoSubtasks).run();
    tx.delete(todos).run();
    tx.delete(anniversaries).run();
    tx.delete(subscriptions).run();
    tx.delete(items).run();
  });

  revalidatePaths(CLEAR_ALL_DATA_PATHS);
  redirectSettingsDataCleared();
}
