import type {
  AnniversaryRecord,
  ItemRecord,
  ListFilters,
  SubscriptionRecord,
  SyncRequest,
  SyncResponse,
  TodoRecord,
} from "./types";

export * from "./types";

/**
 * Unified data access interface for both local-first (SQLite on device)
 * and remote (REST API) implementations.
 *
 * Every mutation returns the resulting row so the caller can update its
 * cache without a second read.
 */
export interface DataStore {
  /** Auth */
  authLogin(password: string): Promise<{ authEnabled: boolean; token: string | null }>;
  authCheck(): Promise<{ authEnabled: boolean; authenticated: boolean }>;

  /** Todos */
  listTodos(filters?: ListFilters & { isDone?: boolean }): Promise<TodoRecord[]>;
  getTodo(id: string): Promise<TodoRecord | null>;
  createTodo(input: Partial<TodoRecord> & { title: string }): Promise<TodoRecord>;
  updateTodo(id: string, patch: Partial<TodoRecord>): Promise<TodoRecord>;
  deleteTodo(id: string, options?: { hard?: boolean }): Promise<void>;

  /** Anniversaries */
  listAnniversaries(filters?: ListFilters): Promise<AnniversaryRecord[]>;
  getAnniversary(id: string): Promise<AnniversaryRecord | null>;
  createAnniversary(input: Partial<AnniversaryRecord> & { title: string; date: string }): Promise<AnniversaryRecord>;
  updateAnniversary(id: string, patch: Partial<AnniversaryRecord>): Promise<AnniversaryRecord>;
  deleteAnniversary(id: string, options?: { hard?: boolean }): Promise<void>;

  /** Subscriptions */
  listSubscriptions(filters?: ListFilters): Promise<SubscriptionRecord[]>;
  getSubscription(id: string): Promise<SubscriptionRecord | null>;
  createSubscription(input: Partial<SubscriptionRecord> & { name: string; nextRenewDate: string }): Promise<SubscriptionRecord>;
  updateSubscription(id: string, patch: Partial<SubscriptionRecord>): Promise<SubscriptionRecord>;
  deleteSubscription(id: string, options?: { hard?: boolean }): Promise<void>;

  /** Items */
  listItems(filters?: ListFilters & { status?: string }): Promise<ItemRecord[]>;
  getItem(id: string): Promise<ItemRecord | null>;
  createItem(input: Partial<ItemRecord> & { name: string }): Promise<ItemRecord>;
  updateItem(id: string, patch: Partial<ItemRecord>): Promise<ItemRecord>;
  deleteItem(id: string, options?: { hard?: boolean }): Promise<void>;

  /** Sync (optional - only relevant for LocalDataStore talking to a server) */
  sync?(request: SyncRequest): Promise<SyncResponse>;
}

export type DataStoreMode = "local" | "remote";

export type CreateDataStoreOptions =
  | { mode: "remote"; baseUrl: string; getToken: () => string | null }
  | { mode: "local"; sqlDriver: LocalSqlDriver };

/**
 * Minimal SQL driver interface so LocalDataStore can work against any
 * SQLite binding (Tauri plugin, Capacitor plugin, sql.js in browser).
 */
export interface LocalSqlDriver {
  execute(sql: string, params?: unknown[]): Promise<void>;
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
}
