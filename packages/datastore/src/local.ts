import type {
  AnniversaryRecord,
  DataStore,
  ItemRecord,
  ListFilters,
  LocalSqlDriver,
  SubscriptionRecord,
  SyncRequest,
  SyncResponse,
  TodoRecord,
} from "./index";
import { LOCAL_SCHEMA_DDL } from "./local-schema";

type TodoRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  tags: string;
  due_at: number | null;
  reminder_offsets_minutes: string;
  recurrence_rule: string | null;
  recurrence_root_id: string | null;
  recurrence_next_id: string | null;
  is_done: number;
  completed_at: number | null;
  is_archived: number;
  archived_at: number | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
};

type AnniversaryRow = {
  id: string;
  title: string;
  category: string;
  date_type: string;
  is_leap_month: number;
  date: string;
  remind_offsets_days: string;
  is_archived: number;
  archived_at: number | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
};

type SubscriptionRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  category: string;
  currency: string;
  cycle_unit: string;
  cycle_interval: number;
  next_renew_date: string;
  auto_renew: number;
  remind_offsets_days: string;
  icon: string | null;
  color: string | null;
  is_archived: number;
  archived_at: number | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
};

type ItemRow = {
  id: string;
  name: string;
  price_cents: number | null;
  currency: string;
  purchased_date: string | null;
  category: string | null;
  status: string;
  usage_count: number;
  target_daily_cost_cents: number | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
};

const toIso = (ms: number | null | undefined): string | null => (ms ? new Date(ms).toISOString() : null);
const fromIso = (iso: string | null | undefined): number | null => (iso ? new Date(iso).getTime() : null);
const parseJson = <T>(s: string | null | undefined, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const rowToTodo = (r: TodoRow): TodoRecord => ({
  id: r.id,
  title: r.title,
  description: r.description,
  taskType: r.task_type,
  priority: r.priority as TodoRecord["priority"],
  tags: parseJson<string[]>(r.tags, []),
  dueAt: toIso(r.due_at),
  reminderOffsetsMinutes: parseJson<number[]>(r.reminder_offsets_minutes, []),
  recurrenceRule: r.recurrence_rule,
  recurrenceRootId: r.recurrence_root_id,
  recurrenceNextId: r.recurrence_next_id,
  isDone: !!r.is_done,
  completedAt: toIso(r.completed_at),
  isArchived: !!r.is_archived,
  archivedAt: toIso(r.archived_at),
  deletedAt: toIso(r.deleted_at),
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
});

const rowToAnniversary = (r: AnniversaryRow): AnniversaryRecord => ({
  id: r.id,
  title: r.title,
  category: r.category,
  dateType: r.date_type as AnniversaryRecord["dateType"],
  isLeapMonth: !!r.is_leap_month,
  date: r.date,
  remindOffsetsDays: parseJson<number[]>(r.remind_offsets_days, []),
  isArchived: !!r.is_archived,
  archivedAt: toIso(r.archived_at),
  deletedAt: toIso(r.deleted_at),
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
});

const rowToSubscription = (r: SubscriptionRow): SubscriptionRecord => ({
  id: r.id,
  name: r.name,
  description: r.description,
  priceCents: r.price_cents,
  category: r.category,
  currency: r.currency,
  cycleUnit: r.cycle_unit as SubscriptionRecord["cycleUnit"],
  cycleInterval: r.cycle_interval,
  nextRenewDate: r.next_renew_date,
  autoRenew: !!r.auto_renew,
  remindOffsetsDays: parseJson<number[]>(r.remind_offsets_days, []),
  icon: r.icon,
  color: r.color,
  isArchived: !!r.is_archived,
  archivedAt: toIso(r.archived_at),
  deletedAt: toIso(r.deleted_at),
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
});

const rowToItem = (r: ItemRow): ItemRecord => ({
  id: r.id,
  name: r.name,
  priceCents: r.price_cents,
  currency: r.currency,
  purchasedDate: r.purchased_date,
  category: r.category,
  status: r.status as ItemRecord["status"],
  usageCount: r.usage_count,
  targetDailyCostCents: r.target_daily_cost_cents,
  deletedAt: toIso(r.deleted_at),
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
});

function uuid(): string {
  // Crypto-random UUID v4 using Web Crypto (works in all modern runtimes)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: not crypto-strong but sufficient for offline devices
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class LocalDataStore implements DataStore {
  private ready = false;

  constructor(private readonly db: LocalSqlDriver) {}

  private async ensureReady() {
    if (this.ready) return;
    for (const ddl of LOCAL_SCHEMA_DDL) {
      await this.db.execute(ddl);
    }
    this.ready = true;
  }

  /** Auth: always "no password" locally - auth is enforced only on the remote. */
  async authLogin(): Promise<{ authEnabled: boolean; token: string | null }> {
    return { authEnabled: false, token: null };
  }
  async authCheck() {
    return { authEnabled: false, authenticated: true };
  }

  /** Todos */
  async listTodos(filters: ListFilters & { isDone?: boolean } = {}): Promise<TodoRecord[]> {
    await this.ensureReady();
    const where: string[] = [];
    const params: unknown[] = [];
    if (!filters.includeDeleted) where.push("deleted_at IS NULL");
    if (!filters.includeArchived) where.push("is_archived = 0");
    if (filters.isDone === true) where.push("is_done = 1");
    if (filters.isDone === false) where.push("is_done = 0");
    const sql = `SELECT * FROM todos${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY is_done ASC, created_at DESC`;
    const rows = await this.db.select<TodoRow>(sql, params);
    return rows.map(rowToTodo);
  }

  async getTodo(id: string): Promise<TodoRecord | null> {
    await this.ensureReady();
    const [row] = await this.db.select<TodoRow>("SELECT * FROM todos WHERE id = ?", [id]);
    return row ? rowToTodo(row) : null;
  }

  async createTodo(input: Partial<TodoRecord> & { title: string }): Promise<TodoRecord> {
    await this.ensureReady();
    const now = Date.now();
    const id = input.id ?? uuid();
    await this.db.execute(
      `INSERT INTO todos (
        id, title, description, task_type, priority, tags, due_at,
        reminder_offsets_minutes, recurrence_rule, is_done, is_archived,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.description ?? null,
        input.taskType ?? "个人",
        input.priority ?? "low",
        JSON.stringify(input.tags ?? []),
        fromIso(input.dueAt ?? null),
        JSON.stringify(input.reminderOffsetsMinutes ?? []),
        input.recurrenceRule ?? null,
        input.isDone ? 1 : 0,
        input.isArchived ? 1 : 0,
        now,
        now,
      ],
    );
    const created = await this.getTodo(id);
    if (!created) throw new Error("failed to read back created todo");
    return created;
  }

  async updateTodo(id: string, patch: Partial<TodoRecord>): Promise<TodoRecord> {
    await this.ensureReady();
    const existing = await this.getTodo(id);
    if (!existing) throw new Error(`todo ${id} not found`);

    const next: TodoRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (patch.isDone !== undefined) next.completedAt = patch.isDone ? new Date().toISOString() : null;
    if (patch.isArchived !== undefined) next.archivedAt = patch.isArchived ? new Date().toISOString() : null;

    await this.db.execute(
      `UPDATE todos SET
        title = ?, description = ?, task_type = ?, priority = ?, tags = ?,
        due_at = ?, reminder_offsets_minutes = ?, recurrence_rule = ?,
        is_done = ?, completed_at = ?, is_archived = ?, archived_at = ?,
        updated_at = ?
        WHERE id = ?`,
      [
        next.title,
        next.description,
        next.taskType,
        next.priority,
        JSON.stringify(next.tags),
        fromIso(next.dueAt),
        JSON.stringify(next.reminderOffsetsMinutes),
        next.recurrenceRule,
        next.isDone ? 1 : 0,
        fromIso(next.completedAt),
        next.isArchived ? 1 : 0,
        fromIso(next.archivedAt),
        fromIso(next.updatedAt),
        id,
      ],
    );
    return next;
  }

  async deleteTodo(id: string, options: { hard?: boolean } = {}) {
    await this.ensureReady();
    if (options.hard) {
      await this.db.execute("DELETE FROM todos WHERE id = ?", [id]);
    } else {
      const now = Date.now();
      await this.db.execute("UPDATE todos SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
    }
  }

  /** Anniversaries */
  async listAnniversaries(filters: ListFilters = {}): Promise<AnniversaryRecord[]> {
    await this.ensureReady();
    const where: string[] = [];
    if (!filters.includeDeleted) where.push("deleted_at IS NULL");
    if (!filters.includeArchived) where.push("is_archived = 0");
    const sql = `SELECT * FROM anniversaries${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const rows = await this.db.select<AnniversaryRow>(sql);
    return rows.map(rowToAnniversary);
  }

  async getAnniversary(id: string): Promise<AnniversaryRecord | null> {
    await this.ensureReady();
    const [row] = await this.db.select<AnniversaryRow>("SELECT * FROM anniversaries WHERE id = ?", [id]);
    return row ? rowToAnniversary(row) : null;
  }

  async createAnniversary(input: Partial<AnniversaryRecord> & { title: string; date: string }): Promise<AnniversaryRecord> {
    await this.ensureReady();
    const now = Date.now();
    const id = input.id ?? uuid();
    await this.db.execute(
      `INSERT INTO anniversaries (id, title, category, date_type, is_leap_month, date, remind_offsets_days, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.category ?? "anniversary",
        input.dateType ?? "solar",
        input.isLeapMonth ? 1 : 0,
        input.date,
        JSON.stringify(input.remindOffsetsDays ?? []),
        input.isArchived ? 1 : 0,
        now,
        now,
      ],
    );
    const created = await this.getAnniversary(id);
    if (!created) throw new Error("failed to read back created anniversary");
    return created;
  }

  async updateAnniversary(id: string, patch: Partial<AnniversaryRecord>): Promise<AnniversaryRecord> {
    await this.ensureReady();
    const existing = await this.getAnniversary(id);
    if (!existing) throw new Error(`anniversary ${id} not found`);

    const next: AnniversaryRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    if (patch.isArchived !== undefined) next.archivedAt = patch.isArchived ? new Date().toISOString() : null;

    await this.db.execute(
      `UPDATE anniversaries SET
        title = ?, category = ?, date_type = ?, is_leap_month = ?, date = ?,
        remind_offsets_days = ?, is_archived = ?, archived_at = ?, updated_at = ?
        WHERE id = ?`,
      [
        next.title,
        next.category,
        next.dateType,
        next.isLeapMonth ? 1 : 0,
        next.date,
        JSON.stringify(next.remindOffsetsDays),
        next.isArchived ? 1 : 0,
        fromIso(next.archivedAt),
        fromIso(next.updatedAt),
        id,
      ],
    );
    return next;
  }

  async deleteAnniversary(id: string, options: { hard?: boolean } = {}) {
    await this.ensureReady();
    if (options.hard) {
      await this.db.execute("DELETE FROM anniversaries WHERE id = ?", [id]);
    } else {
      const now = Date.now();
      await this.db.execute("UPDATE anniversaries SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
    }
  }

  /** Subscriptions */
  async listSubscriptions(filters: ListFilters = {}): Promise<SubscriptionRecord[]> {
    await this.ensureReady();
    const where: string[] = [];
    if (!filters.includeDeleted) where.push("deleted_at IS NULL");
    if (!filters.includeArchived) where.push("is_archived = 0");
    const sql = `SELECT * FROM subscriptions${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const rows = await this.db.select<SubscriptionRow>(sql);
    return rows.map(rowToSubscription);
  }

  async getSubscription(id: string): Promise<SubscriptionRecord | null> {
    await this.ensureReady();
    const [row] = await this.db.select<SubscriptionRow>("SELECT * FROM subscriptions WHERE id = ?", [id]);
    return row ? rowToSubscription(row) : null;
  }

  async createSubscription(input: Partial<SubscriptionRecord> & { name: string; nextRenewDate: string }): Promise<SubscriptionRecord> {
    await this.ensureReady();
    const now = Date.now();
    const id = input.id ?? uuid();
    await this.db.execute(
      `INSERT INTO subscriptions (
        id, name, description, price_cents, category, currency, cycle_unit,
        cycle_interval, next_renew_date, auto_renew, remind_offsets_days,
        icon, color, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description ?? null,
        input.priceCents ?? null,
        input.category ?? "其他",
        input.currency ?? "CNY",
        input.cycleUnit ?? "month",
        input.cycleInterval ?? 1,
        input.nextRenewDate,
        input.autoRenew === false ? 0 : 1,
        JSON.stringify(input.remindOffsetsDays ?? []),
        input.icon ?? null,
        input.color ?? null,
        input.isArchived ? 1 : 0,
        now,
        now,
      ],
    );
    const created = await this.getSubscription(id);
    if (!created) throw new Error("failed to read back created subscription");
    return created;
  }

  async updateSubscription(id: string, patch: Partial<SubscriptionRecord>): Promise<SubscriptionRecord> {
    await this.ensureReady();
    const existing = await this.getSubscription(id);
    if (!existing) throw new Error(`subscription ${id} not found`);

    const next: SubscriptionRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    if (patch.isArchived !== undefined) next.archivedAt = patch.isArchived ? new Date().toISOString() : null;

    await this.db.execute(
      `UPDATE subscriptions SET
        name = ?, description = ?, price_cents = ?, category = ?, currency = ?,
        cycle_unit = ?, cycle_interval = ?, next_renew_date = ?, auto_renew = ?,
        remind_offsets_days = ?, icon = ?, color = ?, is_archived = ?, archived_at = ?,
        updated_at = ?
        WHERE id = ?`,
      [
        next.name,
        next.description,
        next.priceCents,
        next.category,
        next.currency,
        next.cycleUnit,
        next.cycleInterval,
        next.nextRenewDate,
        next.autoRenew ? 1 : 0,
        JSON.stringify(next.remindOffsetsDays),
        next.icon,
        next.color,
        next.isArchived ? 1 : 0,
        fromIso(next.archivedAt),
        fromIso(next.updatedAt),
        id,
      ],
    );
    return next;
  }

  async deleteSubscription(id: string, options: { hard?: boolean } = {}) {
    await this.ensureReady();
    if (options.hard) {
      await this.db.execute("DELETE FROM subscriptions WHERE id = ?", [id]);
    } else {
      const now = Date.now();
      await this.db.execute("UPDATE subscriptions SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
    }
  }

  /** Items */
  async listItems(filters: ListFilters & { status?: string } = {}): Promise<ItemRecord[]> {
    await this.ensureReady();
    const where: string[] = [];
    const params: unknown[] = [];
    if (!filters.includeDeleted) where.push("deleted_at IS NULL");
    if (filters.status) {
      where.push("status = ?");
      params.push(filters.status);
    }
    const sql = `SELECT * FROM items${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const rows = await this.db.select<ItemRow>(sql, params);
    return rows.map(rowToItem);
  }

  async getItem(id: string): Promise<ItemRecord | null> {
    await this.ensureReady();
    const [row] = await this.db.select<ItemRow>("SELECT * FROM items WHERE id = ?", [id]);
    return row ? rowToItem(row) : null;
  }

  async createItem(input: Partial<ItemRecord> & { name: string }): Promise<ItemRecord> {
    await this.ensureReady();
    const now = Date.now();
    const id = input.id ?? uuid();
    await this.db.execute(
      `INSERT INTO items (id, name, price_cents, currency, purchased_date, category, status, usage_count, target_daily_cost_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.priceCents ?? null,
        input.currency ?? "CNY",
        input.purchasedDate ?? null,
        input.category ?? null,
        input.status ?? "active",
        input.usageCount ?? 0,
        input.targetDailyCostCents ?? null,
        now,
        now,
      ],
    );
    const created = await this.getItem(id);
    if (!created) throw new Error("failed to read back created item");
    return created;
  }

  async updateItem(id: string, patch: Partial<ItemRecord>): Promise<ItemRecord> {
    await this.ensureReady();
    const existing = await this.getItem(id);
    if (!existing) throw new Error(`item ${id} not found`);
    const next: ItemRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };

    await this.db.execute(
      `UPDATE items SET
        name = ?, price_cents = ?, currency = ?, purchased_date = ?, category = ?,
        status = ?, usage_count = ?, target_daily_cost_cents = ?, updated_at = ?
        WHERE id = ?`,
      [
        next.name,
        next.priceCents,
        next.currency,
        next.purchasedDate,
        next.category,
        next.status,
        next.usageCount,
        next.targetDailyCostCents,
        fromIso(next.updatedAt),
        id,
      ],
    );
    return next;
  }

  async deleteItem(id: string, options: { hard?: boolean } = {}) {
    await this.ensureReady();
    if (options.hard) {
      await this.db.execute("DELETE FROM items WHERE id = ?", [id]);
    } else {
      const now = Date.now();
      await this.db.execute("UPDATE items SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
    }
  }

  /** Collect local changes since `since` for sync upload. */
  async collectChangesSince(since: string | null): Promise<{
    todos: TodoRecord[];
    anniversaries: AnniversaryRecord[];
    subscriptions: SubscriptionRecord[];
    items: ItemRecord[];
    upToMs: number;
  }> {
    await this.ensureReady();
    const sinceMs = since ? new Date(since).getTime() : 0;
    // Snapshot an upper bound BEFORE the 4 SELECTs. Any write that lands
    // between SELECTs will have updated_at > upToMs (Date.now() is
    // monotonic-ish at ms resolution on all target platforms) and the
    // `AND updated_at <= ?` clause filters it out uniformly. Caller uses
    // upToMs as the next sync watermark so excluded writes are picked up
    // on the next run rather than silently lost.
    const upToMs = Date.now();

    const todoRows = await this.db.select<TodoRow>(
      "SELECT * FROM todos WHERE updated_at > ? AND updated_at <= ?",
      [sinceMs, upToMs],
    );
    const anniversaryRows = await this.db.select<AnniversaryRow>(
      "SELECT * FROM anniversaries WHERE updated_at > ? AND updated_at <= ?",
      [sinceMs, upToMs],
    );
    const subRows = await this.db.select<SubscriptionRow>(
      "SELECT * FROM subscriptions WHERE updated_at > ? AND updated_at <= ?",
      [sinceMs, upToMs],
    );
    const itemRows = await this.db.select<ItemRow>(
      "SELECT * FROM items WHERE updated_at > ? AND updated_at <= ?",
      [sinceMs, upToMs],
    );

    return {
      todos: todoRows.map(rowToTodo),
      anniversaries: anniversaryRows.map(rowToAnniversary),
      subscriptions: subRows.map(rowToSubscription),
      items: itemRows.map(rowToItem),
      upToMs,
    };
  }

  /** Apply remote-origin changes to local DB (LWW). */
  async applyRemoteChanges(changes: Partial<SyncResponse["changes"]>): Promise<void> {
    await this.ensureReady();

    for (const t of changes.todos ?? []) {
      const existing = await this.getTodo(t.id);
      if (existing && existing.updatedAt && t.updatedAt && existing.updatedAt >= t.updatedAt) continue;
      await this.db.execute("DELETE FROM todos WHERE id = ?", [t.id]);
      await this.db.execute(
        `INSERT INTO todos (
          id, title, description, task_type, priority, tags, due_at,
          reminder_offsets_minutes, recurrence_rule, recurrence_root_id, recurrence_next_id,
          is_done, completed_at, is_archived, archived_at, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.title,
          t.description,
          t.taskType,
          t.priority,
          JSON.stringify(t.tags),
          fromIso(t.dueAt),
          JSON.stringify(t.reminderOffsetsMinutes),
          t.recurrenceRule,
          t.recurrenceRootId,
          t.recurrenceNextId,
          t.isDone ? 1 : 0,
          fromIso(t.completedAt),
          t.isArchived ? 1 : 0,
          fromIso(t.archivedAt),
          fromIso(t.deletedAt),
          fromIso(t.createdAt) ?? Date.now(),
          fromIso(t.updatedAt) ?? Date.now(),
        ],
      );
    }

    for (const a of changes.anniversaries ?? []) {
      const existing = await this.getAnniversary(a.id);
      if (existing && existing.updatedAt && a.updatedAt && existing.updatedAt >= a.updatedAt) continue;
      await this.db.execute("DELETE FROM anniversaries WHERE id = ?", [a.id]);
      await this.db.execute(
        `INSERT INTO anniversaries (
          id, title, category, date_type, is_leap_month, date, remind_offsets_days,
          is_archived, archived_at, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.title,
          a.category,
          a.dateType,
          a.isLeapMonth ? 1 : 0,
          a.date,
          JSON.stringify(a.remindOffsetsDays),
          a.isArchived ? 1 : 0,
          fromIso(a.archivedAt),
          fromIso(a.deletedAt),
          fromIso(a.createdAt) ?? Date.now(),
          fromIso(a.updatedAt) ?? Date.now(),
        ],
      );
    }

    for (const s of changes.subscriptions ?? []) {
      const existing = await this.getSubscription(s.id);
      if (existing && existing.updatedAt && s.updatedAt && existing.updatedAt >= s.updatedAt) continue;
      await this.db.execute("DELETE FROM subscriptions WHERE id = ?", [s.id]);
      await this.db.execute(
        `INSERT INTO subscriptions (
          id, name, description, price_cents, category, currency, cycle_unit,
          cycle_interval, next_renew_date, auto_renew, remind_offsets_days,
          icon, color, is_archived, archived_at, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.name,
          s.description,
          s.priceCents,
          s.category,
          s.currency,
          s.cycleUnit,
          s.cycleInterval,
          s.nextRenewDate,
          s.autoRenew ? 1 : 0,
          JSON.stringify(s.remindOffsetsDays),
          s.icon,
          s.color,
          s.isArchived ? 1 : 0,
          fromIso(s.archivedAt),
          fromIso(s.deletedAt),
          fromIso(s.createdAt) ?? Date.now(),
          fromIso(s.updatedAt) ?? Date.now(),
        ],
      );
    }

    for (const i of changes.items ?? []) {
      const existing = await this.getItem(i.id);
      if (existing && existing.updatedAt && i.updatedAt && existing.updatedAt >= i.updatedAt) continue;
      await this.db.execute("DELETE FROM items WHERE id = ?", [i.id]);
      await this.db.execute(
        `INSERT INTO items (
          id, name, price_cents, currency, purchased_date, category, status,
          usage_count, target_daily_cost_cents, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          i.id,
          i.name,
          i.priceCents,
          i.currency,
          i.purchasedDate,
          i.category,
          i.status,
          i.usageCount,
          i.targetDailyCostCents,
          fromIso(i.deletedAt),
          fromIso(i.createdAt) ?? Date.now(),
          fromIso(i.updatedAt) ?? Date.now(),
        ],
      );
    }
  }

  /** Sync state helpers */
  async getSyncState(key: string): Promise<string | null> {
    await this.ensureReady();
    const [row] = await this.db.select<{ value: string | null }>("SELECT value FROM sync_state WHERE key = ?", [key]);
    return row?.value ?? null;
  }

  async setSyncState(key: string, value: string): Promise<void> {
    await this.ensureReady();
    await this.db.execute(
      "INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
  }

  /** LocalDataStore does not implement sync directly - use SyncEngine with a remote. */
  sync?(_: SyncRequest): Promise<SyncResponse> {
    void _;
    throw new Error("LocalDataStore.sync() is not implemented. Use SyncEngine with a RemoteDataStore.");
  }
}
