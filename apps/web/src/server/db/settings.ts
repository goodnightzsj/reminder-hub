import { eq } from "drizzle-orm";

import { db } from "./index";
import { appSettings } from "./schema";

export const DEFAULT_TIME_ZONE = "Asia/Shanghai";
export const DEFAULT_DATE_REMINDER_TIME = "09:00";
const SETTINGS_ID = "singleton";

export async function getAppSettings() {
  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(appSettings).values({
    id: SETTINGS_ID,
    timeZone: DEFAULT_TIME_ZONE,
    updatedAt: new Date(),
  });

  const created = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .limit(1);

  if (created.length > 0) return created[0];

  throw new Error("Failed to create default app settings");
}

export async function setAppTimeZone(timeZone: string) {
  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { timeZone, updatedAt: new Date() },
    });
}

export async function setAppDateReminderTime(dateReminderTime: string) {
  const existing = await getAppSettings();

  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone: existing.timeZone,
      dateReminderTime,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { dateReminderTime, updatedAt: new Date() },
    });
}
