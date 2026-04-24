import type {
  AnniversaryRecord,
  DataStore,
  ItemRecord,
  ListFilters,
  SubscriptionRecord,
  SyncRequest,
  SyncResponse,
  TodoRecord,
} from "./index";

type GetToken = () => string | null;

export class RemoteDataStore implements DataStore {
  constructor(private readonly baseUrl: string, private readonly getToken: GetToken) {}

  private url(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const u = new URL(path, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== false) {
          u.searchParams.set(k, String(v === true ? "1" : v));
        }
      }
    }
    return u.toString();
  }

  private async fetch<T>(path: string, init?: RequestInit & { params?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(this.url(path, init?.params), { ...init, headers });
    const text = await res.text();
    const body = text ? (JSON.parse(text) as unknown) : {};

    if (!res.ok) {
      const err = body as { error?: { code?: string; message?: string } };
      throw new RemoteApiError(res.status, err.error?.code ?? "unknown", err.error?.message ?? res.statusText);
    }
    return body as T;
  }

  /** Auth */
  async authLogin(password: string) {
    return this.fetch<{ authEnabled: boolean; token: string | null }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async authCheck() {
    return this.fetch<{ authEnabled: boolean; authenticated: boolean }>("/api/v1/auth/me");
  }

  /** Todos */
  async listTodos(filters: ListFilters & { isDone?: boolean } = {}): Promise<TodoRecord[]> {
    const res = await this.fetch<{ todos: TodoRecord[] }>("/api/v1/todos", {
      params: {
        includeDeleted: filters.includeDeleted,
        includeArchived: filters.includeArchived,
        isDone: filters.isDone === true ? 1 : filters.isDone === false ? 0 : undefined,
      },
    });
    return res.todos;
  }

  async getTodo(id: string): Promise<TodoRecord | null> {
    try {
      const res = await this.fetch<{ todo: TodoRecord }>(`/api/v1/todos/${encodeURIComponent(id)}`);
      return res.todo;
    } catch (e) {
      if (e instanceof RemoteApiError && e.status === 404) return null;
      throw e;
    }
  }

  async createTodo(input: Partial<TodoRecord> & { title: string }): Promise<TodoRecord> {
    const res = await this.fetch<{ todo: TodoRecord }>("/api/v1/todos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.todo;
  }

  async updateTodo(id: string, patch: Partial<TodoRecord>): Promise<TodoRecord> {
    const res = await this.fetch<{ todo: TodoRecord }>(`/api/v1/todos/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.todo;
  }

  async deleteTodo(id: string, options: { hard?: boolean } = {}) {
    await this.fetch<{ ok: true }>(`/api/v1/todos/${encodeURIComponent(id)}`, {
      method: "DELETE",
      params: { hard: options.hard },
    });
  }

  /** Anniversaries */
  async listAnniversaries(filters: ListFilters = {}): Promise<AnniversaryRecord[]> {
    const res = await this.fetch<{ anniversaries: AnniversaryRecord[] }>("/api/v1/anniversaries", {
      params: { includeDeleted: filters.includeDeleted, includeArchived: filters.includeArchived },
    });
    return res.anniversaries;
  }

  async getAnniversary(id: string): Promise<AnniversaryRecord | null> {
    try {
      const res = await this.fetch<{ anniversary: AnniversaryRecord }>(`/api/v1/anniversaries/${encodeURIComponent(id)}`);
      return res.anniversary;
    } catch (e) {
      if (e instanceof RemoteApiError && e.status === 404) return null;
      throw e;
    }
  }

  async createAnniversary(input: Partial<AnniversaryRecord> & { title: string; date: string }): Promise<AnniversaryRecord> {
    const res = await this.fetch<{ anniversary: AnniversaryRecord }>("/api/v1/anniversaries", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.anniversary;
  }

  async updateAnniversary(id: string, patch: Partial<AnniversaryRecord>): Promise<AnniversaryRecord> {
    const res = await this.fetch<{ anniversary: AnniversaryRecord }>(`/api/v1/anniversaries/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.anniversary;
  }

  async deleteAnniversary(id: string, options: { hard?: boolean } = {}) {
    await this.fetch<{ ok: true }>(`/api/v1/anniversaries/${encodeURIComponent(id)}`, {
      method: "DELETE",
      params: { hard: options.hard },
    });
  }

  /** Subscriptions */
  async listSubscriptions(filters: ListFilters = {}): Promise<SubscriptionRecord[]> {
    const res = await this.fetch<{ subscriptions: SubscriptionRecord[] }>("/api/v1/subscriptions", {
      params: { includeDeleted: filters.includeDeleted, includeArchived: filters.includeArchived },
    });
    return res.subscriptions;
  }

  async getSubscription(id: string): Promise<SubscriptionRecord | null> {
    try {
      const res = await this.fetch<{ subscription: SubscriptionRecord }>(`/api/v1/subscriptions/${encodeURIComponent(id)}`);
      return res.subscription;
    } catch (e) {
      if (e instanceof RemoteApiError && e.status === 404) return null;
      throw e;
    }
  }

  async createSubscription(input: Partial<SubscriptionRecord> & { name: string; nextRenewDate: string }): Promise<SubscriptionRecord> {
    const res = await this.fetch<{ subscription: SubscriptionRecord }>("/api/v1/subscriptions", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.subscription;
  }

  async updateSubscription(id: string, patch: Partial<SubscriptionRecord>): Promise<SubscriptionRecord> {
    const res = await this.fetch<{ subscription: SubscriptionRecord }>(`/api/v1/subscriptions/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.subscription;
  }

  async deleteSubscription(id: string, options: { hard?: boolean } = {}) {
    await this.fetch<{ ok: true }>(`/api/v1/subscriptions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      params: { hard: options.hard },
    });
  }

  /** Items */
  async listItems(filters: ListFilters & { status?: string } = {}): Promise<ItemRecord[]> {
    const res = await this.fetch<{ items: ItemRecord[] }>("/api/v1/items", {
      params: { includeDeleted: filters.includeDeleted, status: filters.status },
    });
    return res.items;
  }

  async getItem(id: string): Promise<ItemRecord | null> {
    try {
      const res = await this.fetch<{ item: ItemRecord }>(`/api/v1/items/${encodeURIComponent(id)}`);
      return res.item;
    } catch (e) {
      if (e instanceof RemoteApiError && e.status === 404) return null;
      throw e;
    }
  }

  async createItem(input: Partial<ItemRecord> & { name: string }): Promise<ItemRecord> {
    const res = await this.fetch<{ item: ItemRecord }>("/api/v1/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.item;
  }

  async updateItem(id: string, patch: Partial<ItemRecord>): Promise<ItemRecord> {
    const res = await this.fetch<{ item: ItemRecord }>(`/api/v1/items/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.item;
  }

  async deleteItem(id: string, options: { hard?: boolean } = {}) {
    await this.fetch<{ ok: true }>(`/api/v1/items/${encodeURIComponent(id)}`, {
      method: "DELETE",
      params: { hard: options.hard },
    });
  }

  /** Sync */
  async sync(request: SyncRequest): Promise<SyncResponse> {
    return this.fetch<SyncResponse>("/api/v1/sync", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}

export class RemoteApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "RemoteApiError";
  }
}
