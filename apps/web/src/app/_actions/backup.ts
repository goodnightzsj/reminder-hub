"use server";

import { db } from "@/server/db";
import { setAppDateReminderTime, setAppTimeZone } from "@/server/db/settings";
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
import { syncInternalScheduler } from "@/server/internal-scheduler";
import {
  parseBackupDateReminderTimeOrRedirect,
  parseBackupRowsOrRedirect,
  parseBackupUploadOrRedirect,
  redirectBackupErrorWithMessage,
  redirectBackupImported,
  redirectBackupMerged,
} from "./backup.import.utils";
import { forEachChunk, getRunChanges } from "./backup.utils";

export async function importBackupOverwrite(formData: FormData) {
  const backup = await parseBackupUploadOrRedirect(formData);
  const dateReminderTime = parseBackupDateReminderTimeOrRedirect(backup);

  const {
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
  } =
    parseBackupRowsOrRedirect(backup);

  try {
    db.transaction((tx) => {
      if (backup.schemaVersion === 2) {
        if (appSettingsRow) tx.delete(appSettings).run();
        tx.delete(brandMetadata).run();
        tx.delete(serviceIcons).run();
        tx.delete(digestDeliveries).run();
      }
      tx.delete(notificationDeliveries).run();
      tx.delete(todoSubtasks).run();
      tx.delete(todos).run();
      tx.delete(anniversaries).run();
      tx.delete(subscriptions).run();
      tx.delete(items).run();

      forEachChunk(todoRows, (chunk) => {
        tx.insert(todos).values(chunk).run();
      });
      forEachChunk(subtaskRows, (chunk) => {
        tx.insert(todoSubtasks).values(chunk).run();
      });
      forEachChunk(anniversaryRows, (chunk) => {
        tx.insert(anniversaries).values(chunk).run();
      });
      forEachChunk(subscriptionRows, (chunk) => {
        tx.insert(subscriptions).values(chunk).run();
      });
      forEachChunk(itemRows, (chunk) => {
        tx.insert(items).values(chunk).run();
      });
      forEachChunk(deliveryRows, (chunk) => {
        tx.insert(notificationDeliveries).values(chunk).run();
      });
      forEachChunk(digestDeliveryRows, (chunk) => {
        tx.insert(digestDeliveries).values(chunk).run();
      });
      forEachChunk(serviceIconRows, (chunk) => {
        tx.insert(serviceIcons).values(chunk).run();
      });
      forEachChunk(brandMetadataRows, (chunk) => {
        tx.insert(brandMetadata).values(chunk).run();
      });
      if (appSettingsRow) {
        tx.insert(appSettings).values(appSettingsRow).run();
      }
    });
  } catch (err) {
    redirectBackupErrorWithMessage("backup-import-failed", err, "Unknown error");
  }

  if (appSettingsRow) {
    await syncInternalScheduler();
  } else {
    await setAppTimeZone(backup.app.timeZone);
    if (dateReminderTime) await setAppDateReminderTime(dateReminderTime);
  }

  redirectBackupImported({
    backupSettings: appSettingsRow ? 1 : 0,
    backupTodos: todoRows.length,
    backupSubtasks: subtaskRows.length,
    backupAnniversaries: anniversaryRows.length,
    backupSubscriptions: subscriptionRows.length,
    backupItems: itemRows.length,
    backupDeliveries: deliveryRows.length,
    backupDigestDeliveries: digestDeliveryRows.length,
  });
}

export async function importBackupMerge(formData: FormData) {
  const backup = await parseBackupUploadOrRedirect(formData);
  const {
    todoRows,
    subtaskRows,
    anniversaryRows,
    subscriptionRows,
    itemRows,
    deliveryRows,
    digestDeliveryRows,
    serviceIconRows,
    brandMetadataRows,
  } =
    parseBackupRowsOrRedirect(backup);

  let insertedTodos = 0;
  let insertedSubtasks = 0;
  let insertedAnniversaries = 0;
  let insertedSubscriptions = 0;
  let insertedItems = 0;
  let insertedDeliveries = 0;
  let insertedDigestDeliveries = 0;

  try {
    db.transaction((tx) => {
      forEachChunk(todoRows, (chunk) => {
        const r = tx
          .insert(todos)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedTodos += getRunChanges(r);
      });

      forEachChunk(subtaskRows, (chunk) => {
        const r = tx
          .insert(todoSubtasks)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedSubtasks += getRunChanges(r);
      });

      forEachChunk(anniversaryRows, (chunk) => {
        const r = tx
          .insert(anniversaries)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedAnniversaries += getRunChanges(r);
      });

      forEachChunk(subscriptionRows, (chunk) => {
        const r = tx
          .insert(subscriptions)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedSubscriptions += getRunChanges(r);
      });

      forEachChunk(itemRows, (chunk) => {
        const r = tx
          .insert(items)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedItems += getRunChanges(r);
      });

      forEachChunk(deliveryRows, (chunk) => {
        const r = tx
          .insert(notificationDeliveries)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedDeliveries += getRunChanges(r);
      });

      forEachChunk(digestDeliveryRows, (chunk) => {
        const r = tx
          .insert(digestDeliveries)
          .values(chunk)
          .onConflictDoNothing()
          .run();
        insertedDigestDeliveries += getRunChanges(r);
      });

      forEachChunk(serviceIconRows, (chunk) => {
        tx.insert(serviceIcons).values(chunk).onConflictDoNothing().run();
      });

      forEachChunk(brandMetadataRows, (chunk) => {
        tx.insert(brandMetadata).values(chunk).onConflictDoNothing().run();
      });
    });
  } catch (err) {
    redirectBackupErrorWithMessage("backup-import-failed", err, "Unknown error");
  }

  redirectBackupMerged({
    backupSettings: 0,
    backupTodos: insertedTodos,
    backupSubtasks: insertedSubtasks,
    backupAnniversaries: insertedAnniversaries,
    backupSubscriptions: insertedSubscriptions,
    backupItems: insertedItems,
    backupDeliveries: insertedDeliveries,
    backupDigestDeliveries: insertedDigestDeliveries,
  });
}
