import "server-only";

import { redirect } from "next/navigation";

import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";
import {
  anniversaries,
  items,
  notificationDeliveries,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";
import { FLASH_FLAG_VALUE_TRUE, FLASH_TOAST_QUERY_KEY, type FlashErrorCode } from "@/lib/flash";

import { withSearchParams } from "./redirect-url";
import { parseFileField } from "./form-data";
import {
  isRecord,
  parseAnniversaryRow,
  parseBackupV1,
  parseItemRow,
  parseNotificationDeliveryRow,
  parseSubscriptionRow,
  parseTodoRow,
  parseTodoSubtaskRow,
  type BackupV1,
} from "./backup-parser";
import { revalidateBackupPaths } from "./backup.utils";
import { SETTINGS_PATH, redirectSettingsError } from "./settings.redirect";

const BACKUP_MESSAGE_MAX_LENGTH = 300;

function getBackupErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export function redirectBackupErrorWithMessage(error: FlashErrorCode, err: unknown, fallback: string): never {
  const message = getBackupErrorMessage(err, fallback).slice(0, BACKUP_MESSAGE_MAX_LENGTH);
  redirect(withSearchParams(SETTINGS_PATH, {
    [FLASH_TOAST_QUERY_KEY.ERROR]: error,
    [FLASH_TOAST_QUERY_KEY.BACKUP_MESSAGE]: message,
  }));
}

export type ParsedBackupRows = {
  todoRows: Array<typeof todos.$inferInsert>;
  subtaskRows: Array<typeof todoSubtasks.$inferInsert>;
  anniversaryRows: Array<typeof anniversaries.$inferInsert>;
  subscriptionRows: Array<typeof subscriptions.$inferInsert>;
  itemRows: Array<typeof items.$inferInsert>;
  deliveryRows: Array<typeof notificationDeliveries.$inferInsert>;
};

export type BackupImportToastStats = {
  backupTodos: number;
  backupSubtasks: number;
  backupAnniversaries: number;
  backupSubscriptions: number;
  backupItems: number;
  backupDeliveries: number;
};

export function redirectBackupImported(stats: BackupImportToastStats): never {
  revalidateBackupPaths();
  redirect(withSearchParams(SETTINGS_PATH, { [FLASH_TOAST_QUERY_KEY.BACKUP_IMPORTED]: FLASH_FLAG_VALUE_TRUE, ...stats }));
}

export function redirectBackupMerged(stats: BackupImportToastStats): never {
  revalidateBackupPaths();
  redirect(withSearchParams(SETTINGS_PATH, { [FLASH_TOAST_QUERY_KEY.BACKUP_MERGED]: FLASH_FLAG_VALUE_TRUE, ...stats }));
}

export async function parseBackupUploadOrRedirect(formData: FormData): Promise<BackupV1> {
  const file = parseFileField(formData, "backupFile");
  if (!file) redirectSettingsError("backup-missing-file");

  let parsed: unknown = null;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    redirectSettingsError("backup-invalid-json");
  }

  const backup = parseBackupV1(parsed);
  if (!backup) redirectSettingsError("backup-invalid-format");
  if (!isValidTimeZone(backup.app.timeZone)) redirectSettingsError("backup-invalid-timezone");

  return backup;
}

export function parseBackupDateReminderTimeOrRedirect(backup: BackupV1): string | null {
  const dateReminderTime =
    typeof backup.app.dateReminderTime === "string"
      ? backup.app.dateReminderTime.trim()
      : null;
  if (dateReminderTime !== null) {
    if (dateReminderTime.length === 0 || !isValidTimeOfDay(dateReminderTime)) {
      redirectSettingsError("backup-invalid-date-reminder-time");
    }
  }
  return dateReminderTime;
}

export function parseBackupRowsOrRedirect(backup: BackupV1): ParsedBackupRows {
  try {
    const todoRows = backup.data.todos.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todos[${i}] is not an object`);
      return parseTodoRow(raw, i);
    });

    const subtaskRows = backup.data.todoSubtasks.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todoSubtasks[${i}] is not an object`);
      return parseTodoSubtaskRow(raw, i);
    });

    const anniversaryRows = backup.data.anniversaries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`anniversaries[${i}] is not an object`);
      return parseAnniversaryRow(raw, i);
    });

    const subscriptionRows = backup.data.subscriptions.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`subscriptions[${i}] is not an object`);
      return parseSubscriptionRow(raw, i);
    });

    const itemRows = backup.data.items.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`items[${i}] is not an object`);
      return parseItemRow(raw, i);
    });

    const deliveryRows = backup.data.notificationDeliveries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`notificationDeliveries[${i}] is not an object`);
      return parseNotificationDeliveryRow(raw, i);
    });

    const todoIds = new Set(todoRows.map((r) => r.id));
    for (const subtask of subtaskRows) {
      if (!todoIds.has(subtask.todoId)) {
        throw new Error(`todoSubtasks.todoId not found: ${subtask.todoId}`);
      }
    }

    return {
      todoRows,
      subtaskRows,
      anniversaryRows,
      subscriptionRows,
      itemRows,
      deliveryRows,
    };
  } catch (err) {
    redirectBackupErrorWithMessage("backup-invalid-format", err, "Invalid backup data");
  }
}
