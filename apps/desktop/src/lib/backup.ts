import type {
  AnniversaryRecord,
  DataStore,
  ItemRecord,
  SubscriptionRecord,
  TodoRecord,
} from "@reminder-hub/datastore";

/**
 * Backup payload schema. Version 1 = everything as plain record arrays.
 * Bump `version` if the on-disk format changes incompatibly; the importer
 * refuses anything it doesn't know how to read.
 */
export type Backup = {
  version: 1;
  exportedAt: string;
  todos: TodoRecord[];
  anniversaries: AnniversaryRecord[];
  subscriptions: SubscriptionRecord[];
  items: ItemRecord[];
};

export async function buildBackup(store: DataStore): Promise<Backup> {
  // includeDeleted so the backup can round-trip tombstones too — important
  // for sync semantics (a restored deleted row shouldn't come back to life).
  const [todos, anniversaries, subscriptions, items] = await Promise.all([
    store.listTodos({ includeDeleted: true, includeArchived: true }),
    store.listAnniversaries({ includeDeleted: true, includeArchived: true }),
    store.listSubscriptions({ includeDeleted: true, includeArchived: true }),
    store.listItems({ includeDeleted: true }),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos,
    anniversaries,
    subscriptions,
    items,
  };
}

export function downloadBackup(backup: Backup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reminder-hub-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click event has finished dispatching.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isRecordArray(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((x) => typeof x === "object" && x !== null);
}

export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("备份文件不是有效的 JSON");
  }
  if (typeof raw !== "object" || raw === null) throw new Error("备份文件格式不正确");
  const b = raw as Record<string, unknown>;
  if (b.version !== 1) throw new Error(`不支持的备份版本：${String(b.version)}`);
  if (typeof b.exportedAt !== "string") throw new Error("备份缺少 exportedAt");
  if (!isRecordArray(b.todos)) throw new Error("备份 todos 字段格式不正确");
  if (!isRecordArray(b.anniversaries)) throw new Error("备份 anniversaries 字段格式不正确");
  if (!isRecordArray(b.subscriptions)) throw new Error("备份 subscriptions 字段格式不正确");
  if (!isRecordArray(b.items)) throw new Error("备份 items 字段格式不正确");
  return b as unknown as Backup;
}

export type ImportReport = {
  todos: number;
  anniversaries: number;
  subscriptions: number;
  items: number;
  skipped: number;
};

/**
 * Upsert every record from the backup into the store. Existing ids are
 * overwritten blindly — callers that want LWW semantics should filter
 * beforehand. We use createX with the backup's own id so ordering stays
 * consistent, and updateX for ids that already exist.
 */
export async function applyBackup(store: DataStore, backup: Backup): Promise<ImportReport> {
  const report: ImportReport = { todos: 0, anniversaries: 0, subscriptions: 0, items: 0, skipped: 0 };

  for (const t of backup.todos) {
    try {
      const existing = await store.getTodo(t.id);
      if (existing) {
        await store.updateTodo(t.id, t);
      } else {
        await store.createTodo(t);
      }
      report.todos++;
    } catch {
      report.skipped++;
    }
  }
  for (const a of backup.anniversaries) {
    try {
      const existing = await store.getAnniversary(a.id);
      if (existing) {
        await store.updateAnniversary(a.id, a);
      } else {
        await store.createAnniversary(a);
      }
      report.anniversaries++;
    } catch {
      report.skipped++;
    }
  }
  for (const s of backup.subscriptions) {
    try {
      const existing = await store.getSubscription(s.id);
      if (existing) {
        await store.updateSubscription(s.id, s);
      } else {
        await store.createSubscription(s);
      }
      report.subscriptions++;
    } catch {
      report.skipped++;
    }
  }
  for (const i of backup.items) {
    try {
      const existing = await store.getItem(i.id);
      if (existing) {
        await store.updateItem(i.id, i);
      } else {
        await store.createItem(i);
      }
      report.items++;
    } catch {
      report.skipped++;
    }
  }

  return report;
}
