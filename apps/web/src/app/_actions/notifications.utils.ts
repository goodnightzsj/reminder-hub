import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { getAppSettings, SETTINGS_ID } from "@/server/db/settings";
import { appSettings } from "@/server/db/schema";
import { SETTINGS_PATH, redirectSettingsSaved } from "./settings.utils";

export { SETTINGS_PATH, redirectSettingsError, redirectSettingsSaved } from "./settings.utils";

export type ExistingAppSettings = Awaited<ReturnType<typeof getAppSettings>>;
export type AppSettingsUpdate = Partial<typeof appSettings.$inferInsert>;

export async function upsertAppSettings(
  existing: ExistingAppSettings,
  set: AppSettingsUpdate,
) {
  const now = new Date();
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.id, set: { ...set, updatedAt: now } });
}

export function revalidateSettings() {
  revalidatePath(SETTINGS_PATH);
}

export function redirectSettingsSavedAfterRevalidate(): never {
  revalidateSettings();
  redirectSettingsSaved();
}

export { normalizeUrl, parsePortStringStrict } from "@/lib/validation/common";
