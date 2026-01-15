import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";
import { FLASH_FLAG_VALUE_TRUE, FLASH_TOAST_QUERY_KEY, type FlashErrorCode } from "@/lib/flash";

import { withSearchParam } from "./redirect-url";

export const SETTINGS_PATH = ROUTES.settings;

export function redirectSettingsSaved(): never {
  redirect(withSearchParam(SETTINGS_PATH, FLASH_TOAST_QUERY_KEY.SAVED, FLASH_FLAG_VALUE_TRUE));
}

export function redirectSettingsDataCleared(): never {
  redirect(withSearchParam(SETTINGS_PATH, FLASH_TOAST_QUERY_KEY.DATA_CLEARED, FLASH_FLAG_VALUE_TRUE));
}

export function redirectSettingsError(code: FlashErrorCode): never {
  redirect(withSearchParam(SETTINGS_PATH, FLASH_TOAST_QUERY_KEY.ERROR, code));
}

