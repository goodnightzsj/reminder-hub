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

  const { todoRows, subtaskRows, anniversaryRows, subscriptionRows, itemRows, deliveryRows } =
    parseBackupRowsOrRedirect(backup);

  try {
    db.transaction((tx) => {
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
    });
  } catch (err) {
    redirectBackupErrorWithMessage("backup-import-failed", err, "Unknown error");
  }

  await setAppTimeZone(backup.app.timeZone);
  if (dateReminderTime) await setAppDateReminderTime(dateReminderTime);

  redirectBackupImported({
    backupTodos: todoRows.length,
    backupSubtasks: subtaskRows.length,
    backupAnniversaries: anniversaryRows.length,
    backupSubscriptions: subscriptionRows.length,
    backupItems: itemRows.length,
    backupDeliveries: deliveryRows.length,
  });
}

export async function importBackupMerge(formData: FormData) {
  const backup = await parseBackupUploadOrRedirect(formData);
  const { todoRows, subtaskRows, anniversaryRows, subscriptionRows, itemRows, deliveryRows } =
    parseBackupRowsOrRedirect(backup);

  let insertedTodos = 0;
  let insertedSubtasks = 0;
  let insertedAnniversaries = 0;
  let insertedSubscriptions = 0;
  let insertedItems = 0;
  let insertedDeliveries = 0;

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
    });
  } catch (err) {
    redirectBackupErrorWithMessage("backup-import-failed", err, "Unknown error");
  }

  redirectBackupMerged({
    backupTodos: insertedTodos,
    backupSubtasks: insertedSubtasks,
    backupAnniversaries: insertedAnniversaries,
    backupSubscriptions: insertedSubscriptions,
    backupItems: insertedItems,
    backupDeliveries: insertedDeliveries,
  });
}
