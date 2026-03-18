import "server-only";

import { zfd } from "zod-form-data";
import { redirect } from "next/navigation";

import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";
import {
  anniversaries,
  appSettings,
  brandMetadata,
  digestDeliveries,
  items,
  notificationDeliveries,
  serviceIcons,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";
import { FLASH_FLAG_VALUE_TRUE, FLASH_TOAST_QUERY_KEY, type FlashErrorCode } from "@/lib/flash";

import { withSearchParams } from "./redirect-url";
import {
  isRecord,
  parseAppSettingsRow,
  parseAnniversaryRow,
  parseBackup,
  parseBrandMetadataRow,
  parseDigestDeliveryRow,
  parseItemRow,
  parseNotificationDeliveryRow,
  parseServiceIconRow,
  parseSubscriptionRow,
  parseTodoRow,
  parseTodoSubtaskRow,
  type BackupFile,
} from "@/server/backup/backup-parser";
import { revalidateBackupPaths } from "./backup.utils";
import { SETTINGS_PATH, redirectSettingsError } from "./settings.utils";

const backupUploadSchema = zfd.formData({
  backupFile: zfd.file(),
});

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
  appSettingsRow: typeof appSettings.$inferInsert | null;
  todoRows: Array<typeof todos.$inferInsert>;
  subtaskRows: Array<typeof todoSubtasks.$inferInsert>;
  anniversaryRows: Array<typeof anniversaries.$inferInsert>;
  subscriptionRows: Array<typeof subscriptions.$inferInsert>;
  itemRows: Array<typeof items.$inferInsert>;
  deliveryRows: Array<typeof notificationDeliveries.$inferInsert>;
  digestDeliveryRows: Array<typeof digestDeliveries.$inferInsert>;
  serviceIconRows: Array<typeof serviceIcons.$inferInsert>;
  brandMetadataRows: Array<typeof brandMetadata.$inferInsert>;
};

export type BackupImportToastStats = {
  backupSettings: number;
  backupTodos: number;
  backupSubtasks: number;
  backupAnniversaries: number;
  backupSubscriptions: number;
  backupItems: number;
  backupDeliveries: number;
  backupDigestDeliveries: number;
};

export function redirectBackupImported(stats: BackupImportToastStats): never {
  revalidateBackupPaths();
  redirect(withSearchParams(SETTINGS_PATH, { [FLASH_TOAST_QUERY_KEY.BACKUP_IMPORTED]: FLASH_FLAG_VALUE_TRUE, ...stats }));
}

export function redirectBackupMerged(stats: BackupImportToastStats): never {
  revalidateBackupPaths();
  redirect(withSearchParams(SETTINGS_PATH, { [FLASH_TOAST_QUERY_KEY.BACKUP_MERGED]: FLASH_FLAG_VALUE_TRUE, ...stats }));
}

export async function parseBackupUploadOrRedirect(formData: FormData): Promise<BackupFile> {
  const result = backupUploadSchema.safeParse(formData);
  if (!result.success) {
    redirectSettingsError("backup-missing-file");
  }
  
  const file = result.data.backupFile;
  
  // Zod file check above ensures it exists, but let's double check content
  if (!file || file.size === 0) redirectSettingsError("backup-missing-file");

  let parsed: unknown = null;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    redirectSettingsError("backup-invalid-json");
  }

  const backup = parseBackup(parsed);
  if (!backup) redirectSettingsError("backup-invalid-format");
  if (!isValidTimeZone(backup.app.timeZone)) redirectSettingsError("backup-invalid-timezone");

  return backup;
}

export function parseBackupDateReminderTimeOrRedirect(backup: BackupFile): string | null {
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

export function parseBackupRowsOrRedirect(backup: BackupFile): ParsedBackupRows {
  try {
    let appSettingsRow: typeof appSettings.$inferInsert | null = null;
    if (backup.schemaVersion === 2 && backup.app.settings) {
      appSettingsRow = parseAppSettingsRow(backup.app.settings);

      if (appSettingsRow.timeZone !== backup.app.timeZone) {
        throw new Error("app.settings.timeZone must match app.timeZone");
      }

      if (
        typeof backup.app.dateReminderTime === "string" &&
        appSettingsRow.dateReminderTime !== backup.app.dateReminderTime.trim()
      ) {
        throw new Error("app.settings.dateReminderTime must match app.dateReminderTime");
      }
    }

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

    const digestDeliveryRows =
      backup.schemaVersion === 2
        ? backup.data.digestDeliveries.map((raw, i) => {
            if (!isRecord(raw)) throw new Error(`digestDeliveries[${i}] is not an object`);
            return parseDigestDeliveryRow(raw, i);
          })
        : [];

    const serviceIconRows =
      backup.schemaVersion === 2
        ? backup.data.serviceIcons.map((raw, i) => {
            if (!isRecord(raw)) throw new Error(`serviceIcons[${i}] is not an object`);
            return parseServiceIconRow(raw, i);
          })
        : [];

    const brandMetadataRows =
      backup.schemaVersion === 2
        ? backup.data.brandMetadata.map((raw, i) => {
            if (!isRecord(raw)) throw new Error(`brandMetadata[${i}] is not an object`);
            return parseBrandMetadataRow(raw, i);
          })
        : [];

    const todoIds = new Set(todoRows.map((r) => r.id));
    for (const subtask of subtaskRows) {
      if (!todoIds.has(subtask.todoId)) {
        throw new Error(`todoSubtasks.todoId not found: ${subtask.todoId}`);
      }
    }

    return {
      appSettingsRow,
      todoRows,
      subtaskRows,
      anniversaryRows,
      subscriptionRows,
      itemRows,
      deliveryRows,
      digestDeliveryRows,
      serviceIconRows,
      brandMetadataRows,
    };
  } catch (err) {
    redirectBackupErrorWithMessage("backup-invalid-format", err, "Invalid backup data");
  }
}
