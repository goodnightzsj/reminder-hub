import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAppSettingsRow,
  parseBackup,
  parseBrandMetadataRow,
  parseDigestDeliveryRow,
  parseServiceIconRow,
  parseSubscriptionRow,
  parseTodoRow,
} from "@/server/backup/backup-parser";
import { SETTINGS_ID } from "@/server/db/settings";

test("parseBackup accepts schemaVersion 1 backups", () => {
  const backup = parseBackup({
    schemaVersion: 1,
    exportedAt: "2026-03-18T10:00:00.000Z",
    app: {
      timeZone: "Asia/Shanghai",
      dateReminderTime: "09:00",
    },
    data: {
      todos: [],
      todoSubtasks: [],
      anniversaries: [],
      subscriptions: [],
      items: [],
      notificationDeliveries: [],
    },
  });

  assert.ok(backup);
  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.app.timeZone, "Asia/Shanghai");
});

test("parseBackup accepts schemaVersion 2 backups with full deployment data", () => {
  const backup = parseBackup({
    schemaVersion: 2,
    exportedAt: "2026-03-18T10:00:00.000Z",
    app: {
      timeZone: "Asia/Shanghai",
      dateReminderTime: "10:00",
      settings: {
        id: SETTINGS_ID,
        timeZone: "Asia/Shanghai",
        dateReminderTime: "10:00",
      },
    },
    data: {
      todos: [],
      todoSubtasks: [],
      anniversaries: [],
      subscriptions: [],
      items: [],
      notificationDeliveries: [],
      digestDeliveries: [],
      serviceIcons: [],
      brandMetadata: [],
    },
  });

  assert.ok(backup);
  assert.equal(backup.schemaVersion, 2);
  assert.deepEqual(backup.data.digestDeliveries, []);
  assert.deepEqual(backup.data.serviceIcons, []);
  assert.deepEqual(backup.data.brandMetadata, []);
});

test("row parsers preserve deleted state and rich subscription fields", () => {
  const deletedAtMs = Date.UTC(2026, 2, 18, 8, 0, 0);

  const todoRow = parseTodoRow(
    {
      id: "todo-1",
      title: "Plan migration",
      deletedAt: deletedAtMs,
    },
    0,
  );

  const subscriptionRow = parseSubscriptionRow(
    {
      id: "sub-1",
      name: "Reminder Hub Pro",
      nextRenewDate: "2026-04-01",
      category: "工具",
      icon: "simple-icons:docker",
      color: "#2496ED",
      deletedAt: deletedAtMs,
    },
    0,
  );

  assert.equal(todoRow.deletedAt?.getTime(), deletedAtMs);
  assert.equal(subscriptionRow.category, "工具");
  assert.equal(subscriptionRow.icon, "simple-icons:docker");
  assert.equal(subscriptionRow.color, "#2496ED");
  assert.equal(subscriptionRow.deletedAt?.getTime(), deletedAtMs);
});

test("settings and cache parsers restore timestamps", () => {
  const nowMs = Date.UTC(2026, 2, 18, 10, 0, 0);

  const settingsRow = parseAppSettingsRow({
    id: SETTINGS_ID,
    timeZone: "Asia/Shanghai",
    dateReminderTime: "09:30",
    internalSchedulerEnabled: true,
    internalDigestTime: "10:00",
    createdAt: nowMs,
    updatedAt: nowMs,
  });

  const digestRow = parseDigestDeliveryRow(
    {
      id: "digest:weekly:feishu:2026-03-16",
      digestType: "weekly",
      channel: "feishu",
      periodStart: "2026-03-09",
      periodEnd: "2026-03-15",
      sentAt: nowMs,
      createdAt: nowMs,
      updatedAt: nowMs,
    },
    0,
  );

  const iconRow = parseServiceIconRow(
    {
      name: "Docker",
      icon: "simple-icons:docker",
      color: "#2496ED",
      lastFetchedAt: nowMs,
      createdAt: nowMs,
      updatedAt: nowMs,
    },
    0,
  );

  const brandRow = parseBrandMetadataRow(
    {
      slug: "docker",
      title: "Docker",
      hex: "#2496ED",
      updatedAt: nowMs,
    },
    0,
  );

  assert.equal(settingsRow.internalSchedulerEnabled, true);
  assert.equal(settingsRow.createdAt?.getTime(), nowMs);
  assert.equal(digestRow.sentAt?.getTime(), nowMs);
  assert.equal(iconRow.lastFetchedAt?.getTime(), nowMs);
  assert.equal(brandRow.updatedAt?.getTime(), nowMs);
});
