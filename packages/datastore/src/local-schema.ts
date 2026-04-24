/**
 * SQLite schema for LocalDataStore. Column names match the Web server's
 * Drizzle schema exactly so sync payloads can be inserted as-is.
 *
 * Kept intentionally minimal - only the core user-facing tables. Notification
 * history, digest deliveries, etc. live server-side only.
 */
export const LOCAL_SCHEMA_DDL = [
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL DEFAULT '个人',
    priority TEXT NOT NULL DEFAULT 'low',
    tags TEXT NOT NULL DEFAULT '[]',
    due_at INTEGER,
    reminder_offsets_minutes TEXT NOT NULL DEFAULT '[]',
    recurrence_rule TEXT,
    recurrence_root_id TEXT,
    recurrence_next_id TEXT,
    is_done INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    is_archived INTEGER NOT NULL DEFAULT 0,
    archived_at INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()*1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()*1000)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_is_done ON todos(is_done)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_updated_at ON todos(updated_at)`,

  `CREATE TABLE IF NOT EXISTS anniversaries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'anniversary',
    date_type TEXT NOT NULL DEFAULT 'solar',
    is_leap_month INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    remind_offsets_days TEXT NOT NULL DEFAULT '[]',
    is_archived INTEGER NOT NULL DEFAULT 0,
    archived_at INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()*1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()*1000)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_anniversaries_updated_at ON anniversaries(updated_at)`,

  `CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER,
    category TEXT NOT NULL DEFAULT '其他',
    currency TEXT NOT NULL DEFAULT 'CNY',
    cycle_unit TEXT NOT NULL DEFAULT 'month',
    cycle_interval INTEGER NOT NULL DEFAULT 1,
    next_renew_date TEXT NOT NULL,
    auto_renew INTEGER NOT NULL DEFAULT 1,
    remind_offsets_days TEXT NOT NULL DEFAULT '[]',
    icon TEXT,
    color TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    archived_at INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()*1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()*1000)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_at ON subscriptions(updated_at)`,

  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_cents INTEGER,
    currency TEXT NOT NULL DEFAULT 'CNY',
    purchased_date TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    usage_count INTEGER NOT NULL DEFAULT 0,
    target_daily_cost_cents INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()*1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()*1000)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at)`,

  `CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
];
