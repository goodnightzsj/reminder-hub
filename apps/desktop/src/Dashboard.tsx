import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type {
  AnniversaryRecord,
  DataStore,
  ItemRecord,
  SubscriptionRecord,
  SyncEngine,
  TodoRecord,
} from "@reminder-hub/datastore";
import type { AppConfig } from "./lib/app-config";
import { useToast } from "./ui/Toast";
import { DeferredSkeleton, Skeleton, TodoListSkeleton } from "./ui/Skeleton";
import { ConfirmDeleteButton } from "./ui/ConfirmDelete";

type Tab = "overview" | "todo" | "anniversary" | "subscription" | "item" | "settings";

type DashboardProps = {
  config: AppConfig;
  store: DataStore;
  syncEngine: SyncEngine | null;
  onLogout: () => Promise<void>;
};

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "overview", label: "概览", icon: "ri:layout-grid-line" },
  { id: "todo", label: "待办", icon: "ri:task-line" },
  { id: "anniversary", label: "纪念日", icon: "ri:calendar-event-line" },
  { id: "subscription", label: "订阅", icon: "ri:bank-card-line" },
  { id: "item", label: "物品", icon: "ri:box-3-line" },
  { id: "settings", label: "设置", icon: "ri:settings-3-line" },
];

export function Dashboard({ config, store, syncEngine, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const runSync = async () => {
    if (!syncEngine) return;
    setSyncing(true);
    const result = await syncEngine.run();
    setSyncing(false);
    if (result.kind === "success") {
      toast.show(
        "success",
        `同步完成：上传 ${result.uploaded}，下载 ${result.downloaded}`,
      );
    } else if (result.kind === "error") {
      toast.show("error", `同步失败：${result.message}`);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-card/40">
        <div className="drag-region h-12 flex items-center gap-2 px-4">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <Icon icon="ri:shield-keyhole-line" className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Reminder Hub</span>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`no-drag w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-brand-primary/10 text-brand-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon icon={t.icon} className="h-4 w-4 shrink-0" />
                <span>{t.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-2 space-y-0.5">
          {syncEngine && (
            <button
              onClick={runSync}
              disabled={syncing}
              className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-60"
            >
              <Icon
                icon={syncing ? "line-md:loading-twotone-loop" : "ri:refresh-line"}
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">{syncing ? "同步中…" : "同步"}</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <Icon icon="ri:logout-box-r-line" className="h-4 w-4 shrink-0" />
            <span>退出登录</span>
          </button>
        </div>

        {/* Status footer */}
        <div className="px-3 py-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${config.token ? "bg-success" : "bg-muted-foreground/40"}`} />
            {config.mode === "local" ? (
              config.token ? "本地 + 同步" : "纯本地"
            ) : (
              "云端模式"
            )}
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="drag-region h-12 flex items-center justify-between px-6 border-b border-border/60 bg-card/20 backdrop-blur">
          <h1 className="text-sm font-semibold tracking-tight">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
        </header>

        <div className="flex-1 overflow-hidden">
          {tab === "overview" && <OverviewPanel store={store} onNavigate={setTab} />}
          {tab === "todo" && <TodoPanel store={store} />}
          {tab === "anniversary" && <AnniversaryPanel store={store} />}
          {tab === "subscription" && <SubscriptionPanel store={store} />}
          {tab === "item" && <ItemPanel store={store} />}
          {tab === "settings" && <SettingsPanel config={config} />}
        </div>
      </main>
    </div>
  );
}

function TodoPanel({ store }: { store: DataStore }) {
  const [todos, setTodos] = useState<TodoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listTodos();
      setTodos(rows);
    } catch (e) {
      toast.show("error", `加载失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const add = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await store.createTodo({ title });
      setNewTitle("");
      await refresh();
    } catch (e) {
      toast.show("error", `创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const toggle = async (t: TodoRecord) => {
    try {
      await store.updateTodo(t.id, { isDone: !t.isDone });
      await refresh();
    } catch (e) {
      toast.show("error", `更新失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await store.deleteTodo(id);
      await refresh();
      toast.show("info", "已删除");
    } catch (e) {
      toast.show("error", `删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Quick add */}
      <div className="px-6 pt-4 pb-3 border-b border-border/40">
        <div className="relative max-w-xl">
          <Icon
            icon="ri:add-line"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="快速添加待办… (Enter 确认)"
            className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex-1 scroll-area px-6 py-4">
        {loading ? (
          <DeferredSkeleton>
            <TodoListSkeleton />
          </DeferredSkeleton>
        ) : todos.length === 0 ? (
          <EmptyState icon="ri:task-line" title="暂无待办" subtitle="在上方输入框快速添加" />
        ) : (
          <ul className="space-y-1.5 max-w-2xl">
            {todos.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
              >
                <button
                  onClick={() => toggle(t)}
                  className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    t.isDone
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border hover:border-brand-primary/50"
                  }`}
                >
                  {t.isDone && <Icon icon="ri:check-line" className="h-3.5 w-3.5 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${t.isDone ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </span>
                {t.priority === "high" && !t.isDone && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger font-medium">
                    HIGH
                  </span>
                )}
                <ConfirmDeleteButton onConfirm={() => remove(t.id)} label="删除待办" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon icon={icon} className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SettingsPanel({ config }: { config: AppConfig }) {
  return (
    <div className="h-full scroll-area px-6 py-6">
      <div className="max-w-2xl space-y-4">
        <InfoRow icon="ri:database-2-line" label="数据模式" value={config.mode === "local" ? "本地优先" : "纯云端"} />
        <InfoRow icon="ri:global-line" label="服务器地址" value={config.remoteBaseUrl || "（未配置）"} />
        <InfoRow
          icon="ri:shield-check-line"
          label="登录状态"
          value={config.token ? "已登录" : "未登录"}
          valueColor={config.token ? "text-success" : "text-muted-foreground"}
        />
        <div className="pt-4 text-xs text-muted-foreground leading-relaxed">
          <p className="mb-1.5">数据文件位置：</p>
          <code className="block px-3 py-2 rounded bg-muted font-mono text-[11px]">
            ~/Library/Application Support/com.reminderhub.desktop/reminder-hub.db
          </code>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor = "text-foreground",
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <Icon icon={icon} className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

// --- Anniversary panel ---------------------------------------------------

type Countdown =
  | { kind: "today"; label: string }
  | { kind: "upcoming"; days: number; label: string }
  | { kind: "past"; days: number; label: string };

/**
 * Compute next anniversary date and days delta for a YYYY-MM-DD input.
 * Ignores lunar for the desktop MVP — we render the raw date label for
 * lunar entries but still approximate countdown with the gregorian date.
 */
function getNextAnniversary(dateStr: string, now = new Date()): Countdown {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return { kind: "past", days: 0, label: "日期无效" };
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month, day);
  const msPerDay = 86_400_000;
  const diffDays = Math.round((next.getTime() - today.getTime()) / msPerDay);
  if (diffDays === 0) return { kind: "today", label: "就是今天！" };
  return { kind: "upcoming", days: diffDays, label: `还有 ${diffDays} 天` };
}

function AnniversaryPanel({ store }: { store: DataStore }) {
  const [items, setItems] = useState<AnniversaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listAnniversaries();
      // Sort by upcoming days ascending.
      rows.sort((a, b) => {
        const da = getNextAnniversary(a.date);
        const db = getNextAnniversary(b.date);
        const aDays = da.kind === "today" ? 0 : da.kind === "upcoming" ? da.days : 9999;
        const bDays = db.kind === "today" ? 0 : db.kind === "upcoming" ? db.days : 9999;
        return aDays - bDays;
      });
      setItems(rows);
    } catch (e) {
      toast.show("error", `加载失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const add = async () => {
    const t = title.trim();
    if (!t) {
      toast.show("error", "请填写标题");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.show("error", "请选择日期");
      return;
    }
    try {
      await store.createAnniversary({ title: t, date });
      setTitle("");
      setDate("");
      await refresh();
      toast.show("success", "已添加");
    } catch (e) {
      toast.show("error", `创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await store.deleteAnniversary(id);
      await refresh();
      toast.show("info", "已删除");
    } catch (e) {
      toast.show("error", `删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Quick add */}
      <div className="px-6 pt-4 pb-3 border-b border-border/40">
        <div className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Icon
              icon="ri:calendar-event-line"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="纪念日标题…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-36 rounded-xl border border-border bg-card px-3 text-sm outline-none"
          />
          <button
            onClick={add}
            className="h-11 px-4 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all active:scale-[0.97]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="ri:add-line" className="h-4 w-4" /> 添加
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 scroll-area px-6 py-4">
        {loading ? (
          <DeferredSkeleton>
            <AnniversaryListSkeleton />
          </DeferredSkeleton>
        ) : items.length === 0 ? (
          <EmptyState icon="ri:calendar-event-line" title="暂无纪念日" subtitle="添加生日、周年等日期，每年自动提醒" />
        ) : (
          <ul className="space-y-2 max-w-2xl">
            {items.map((a) => {
              const cd = getNextAnniversary(a.date);
              const badgeClass =
                cd.kind === "today"
                  ? "bg-brand-primary text-white"
                  : cd.kind === "upcoming" && cd.days <= 7
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "bg-muted text-muted-foreground";
              return (
                <li
                  key={a.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-brand-primary/40 transition-colors animate-fade-in"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center shrink-0">
                    <Icon icon="ri:calendar-event-line" className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{a.date}</span>
                      {a.dateType === "lunar" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          农历
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeClass}`}>
                    {cd.label}
                  </span>
                  <ConfirmDeleteButton onConfirm={() => remove(a.id)} label="删除纪念日" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AnniversaryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-2 max-w-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4" style={{ maxWidth: `${40 + ((i * 13) % 30)}%` }} />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

// --- Subscription panel --------------------------------------------------

const CYCLE_UNITS: Array<{ value: "day" | "week" | "month" | "year"; label: string }> = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  HKD: "HK$",
};

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents == null) return "—";
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${(priceCents / 100).toFixed(2)}`;
}

function daysUntil(dateStr: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function SubscriptionPanel({ store }: { store: DataStore }) {
  const [items, setItems] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [priceYuan, setPriceYuan] = useState("");
  const [cycleUnit, setCycleUnit] = useState<"day" | "week" | "month" | "year">("month");
  const [nextRenewDate, setNextRenewDate] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listSubscriptions();
      rows.sort((a, b) => {
        const da = daysUntil(a.nextRenewDate) ?? 9999;
        const db = daysUntil(b.nextRenewDate) ?? 9999;
        return da - db;
      });
      setItems(rows);
    } catch (e) {
      toast.show("error", `加载失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const add = async () => {
    const n = name.trim();
    if (!n) return toast.show("error", "请填写名称");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextRenewDate)) return toast.show("error", "请选择下次续费日");
    const parsed = priceYuan === "" ? null : Math.round(Number(priceYuan) * 100);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      return toast.show("error", "价格无效");
    }
    try {
      await store.createSubscription({
        name: n,
        priceCents: parsed,
        cycleUnit,
        cycleInterval: 1,
        nextRenewDate,
        currency,
      });
      setName("");
      setPriceYuan("");
      setNextRenewDate("");
      await refresh();
      toast.show("success", "已添加");
    } catch (e) {
      toast.show("error", `创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await store.deleteSubscription(id);
      await refresh();
      toast.show("info", "已删除");
    } catch (e) {
      toast.show("error", `删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-border/40">
        <div className="flex flex-wrap gap-2 max-w-3xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="订阅名称（如 Spotify、iCloud）"
            className="h-11 flex-[2] min-w-[180px] rounded-xl border border-border bg-card px-3 text-sm outline-none"
          />
          <div className="flex items-center rounded-xl border border-border bg-card overflow-hidden">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 pl-3 pr-2 text-sm outline-none bg-transparent border-r border-border cursor-pointer"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
            <input
              value={priceYuan}
              onChange={(e) => setPriceYuan(e.target.value)}
              placeholder="价格"
              inputMode="decimal"
              className="h-11 w-20 px-2 text-sm outline-none bg-transparent"
            />
          </div>
          <select
            value={cycleUnit}
            onChange={(e) => setCycleUnit(e.target.value as typeof cycleUnit)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none cursor-pointer"
          >
            {CYCLE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                每{u.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={nextRenewDate}
            onChange={(e) => setNextRenewDate(e.target.value)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none"
          />
          <button
            onClick={add}
            className="h-11 px-4 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all active:scale-[0.97]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="ri:add-line" className="h-4 w-4" /> 添加
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 scroll-area px-6 py-4">
        {loading ? (
          <DeferredSkeleton>
            <AnniversaryListSkeleton />
          </DeferredSkeleton>
        ) : items.length === 0 ? (
          <EmptyState icon="ri:bank-card-line" title="暂无订阅" subtitle="记录月/年费，到期自动提醒" />
        ) : (
          <ul className="space-y-2 max-w-3xl">
            {items.map((s) => {
              const d = daysUntil(s.nextRenewDate);
              const badgeClass =
                d == null
                  ? "bg-muted text-muted-foreground"
                  : d < 0
                  ? "bg-danger/15 text-danger"
                  : d === 0
                  ? "bg-brand-primary text-white"
                  : d <= 7
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "bg-muted text-muted-foreground";
              const badgeLabel =
                d == null
                  ? "日期无效"
                  : d < 0
                  ? `已过 ${-d} 天`
                  : d === 0
                  ? "今天续费"
                  : `${d} 天后`;
              const unitLabel = CYCLE_UNITS.find((u) => u.value === s.cycleUnit)?.label ?? "月";
              return (
                <li
                  key={s.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-brand-primary/40 transition-colors animate-fade-in"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: s.color
                        ? `${s.color}22`
                        : "linear-gradient(135deg, rgba(41,112,237,0.1), rgba(86,160,240,0.1))",
                    }}
                  >
                    <Icon
                      icon={s.icon ?? "ri:bank-card-line"}
                      className="h-5 w-5"
                      style={{ color: s.color ?? "var(--color-brand-primary)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{formatPrice(s.priceCents, s.currency)}</span>
                      <span className="opacity-60">·</span>
                      <span>每{unitLabel}</span>
                      <span className="opacity-60">·</span>
                      <span>{s.nextRenewDate}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                  <ConfirmDeleteButton onConfirm={() => remove(s.id)} label="删除订阅" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Item panel ----------------------------------------------------------

const ITEM_STATUSES: Array<{ value: "active" | "idle" | "retired"; label: string; color: string }> = [
  { value: "active", label: "在用", color: "text-success bg-success/10" },
  { value: "idle", label: "闲置", color: "text-muted-foreground bg-muted" },
  { value: "retired", label: "弃用", color: "text-danger bg-danger/10" },
];

function daysOwned(dateStr: string | null, now = new Date()): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const purchased = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = Math.round((today.getTime() - purchased.getTime()) / 86_400_000);
  return d < 0 ? 0 : d;
}

function formatDailyCost(priceCents: number | null, purchasedDate: string | null, currency: string): string | null {
  const d = daysOwned(purchasedDate);
  if (priceCents == null || d == null || d <= 0) return null;
  const perDay = priceCents / d / 100;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${perDay.toFixed(2)}/天`;
}

function ItemPanel({ store }: { store: DataStore }) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [priceYuan, setPriceYuan] = useState("");
  const [purchasedDate, setPurchasedDate] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [status, setStatus] = useState<"active" | "idle" | "retired">("active");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listItems();
      rows.sort((a, b) => {
        // Active first, then by created date desc
        if (a.status !== b.status) {
          if (a.status === "active") return -1;
          if (b.status === "active") return 1;
          if (a.status === "idle") return -1;
          if (b.status === "idle") return 1;
        }
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
      setItems(rows);
    } catch (e) {
      toast.show("error", `加载失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const add = async () => {
    const n = name.trim();
    if (!n) return toast.show("error", "请填写物品名称");
    const parsed = priceYuan === "" ? null : Math.round(Number(priceYuan) * 100);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      return toast.show("error", "价格无效");
    }
    try {
      await store.createItem({
        name: n,
        priceCents: parsed,
        currency,
        purchasedDate: purchasedDate || null,
        status,
      });
      setName("");
      setPriceYuan("");
      setPurchasedDate("");
      setStatus("active");
      await refresh();
      toast.show("success", "已添加");
    } catch (e) {
      toast.show("error", `创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const toggleStatus = async (item: ItemRecord) => {
    // Cycle active -> idle -> retired -> active
    const next: ItemRecord["status"] =
      item.status === "active" ? "idle" : item.status === "idle" ? "retired" : "active";
    try {
      await store.updateItem(item.id, { status: next });
      await refresh();
    } catch (e) {
      toast.show("error", `更新失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await store.deleteItem(id);
      await refresh();
      toast.show("info", "已删除");
    } catch (e) {
      toast.show("error", `删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-border/40">
        <div className="flex flex-wrap gap-2 max-w-3xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="物品名称（如 MacBook、相机）"
            className="h-11 flex-[2] min-w-[180px] rounded-xl border border-border bg-card px-3 text-sm outline-none"
          />
          <div className="flex items-center rounded-xl border border-border bg-card overflow-hidden">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 pl-3 pr-2 text-sm outline-none bg-transparent border-r border-border cursor-pointer"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
            <input
              value={priceYuan}
              onChange={(e) => setPriceYuan(e.target.value)}
              placeholder="价格"
              inputMode="decimal"
              className="h-11 w-20 px-2 text-sm outline-none bg-transparent"
            />
          </div>
          <input
            type="date"
            value={purchasedDate}
            onChange={(e) => setPurchasedDate(e.target.value)}
            placeholder="购入日期"
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none cursor-pointer"
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="h-11 px-4 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all active:scale-[0.97]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="ri:add-line" className="h-4 w-4" /> 添加
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 scroll-area px-6 py-4">
        {loading ? (
          <DeferredSkeleton>
            <AnniversaryListSkeleton />
          </DeferredSkeleton>
        ) : items.length === 0 ? (
          <EmptyState
            icon="ri:box-3-line"
            title="暂无物品"
            subtitle="记录购入价 + 日期，看清每日成本"
          />
        ) : (
          <ul className="space-y-2 max-w-3xl">
            {items.map((i) => {
              const owned = daysOwned(i.purchasedDate);
              const dailyCost = formatDailyCost(i.priceCents, i.purchasedDate, i.currency);
              const statusCfg = ITEM_STATUSES.find((s) => s.value === i.status) ?? ITEM_STATUSES[0];
              return (
                <li
                  key={i.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-brand-primary/40 transition-colors animate-fade-in"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center shrink-0">
                    <Icon icon="ri:box-3-line" className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono">{formatPrice(i.priceCents, i.currency)}</span>
                      {owned != null && (
                        <>
                          <span className="opacity-60">·</span>
                          <span>已用 {owned} 天</span>
                        </>
                      )}
                      {dailyCost && (
                        <>
                          <span className="opacity-60">·</span>
                          <span className="text-brand-primary font-medium">{dailyCost}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(i)}
                    title="点击切换状态"
                    aria-label={`当前状态：${statusCfg.label}，点击切换`}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${statusCfg.color} hover:opacity-80`}
                  >
                    {statusCfg.label}
                  </button>
                  <ConfirmDeleteButton onConfirm={() => remove(i.id)} label="删除物品" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Overview panel -----------------------------------------------------

type UpcomingEntry =
  | { kind: "todo"; id: string; title: string; daysUntil: number; dueAt: string }
  | { kind: "anniversary"; id: string; title: string; daysUntil: number; date: string }
  | { kind: "subscription"; id: string; name: string; daysUntil: number; date: string; priceCents: number | null; currency: string };

function OverviewPanel({
  store,
  onNavigate,
}: {
  store: DataStore;
  onNavigate: (tab: Tab) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<TodoRecord[]>([]);
  const [anniversaries, setAnniversaries] = useState<AnniversaryRecord[]>([]);
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [t, a, s, i] = await Promise.all([
          store.listTodos(),
          store.listAnniversaries(),
          store.listSubscriptions(),
          store.listItems(),
        ]);
        setTodos(t);
        setAnniversaries(a);
        setSubs(s);
        setItems(i);
      } catch (e) {
        toast.show("error", `加载失败：${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const now = new Date();

  // Stats
  const openTodos = todos.filter((t) => !t.isDone).length;
  const upcomingAnniversaries = anniversaries.filter((a) => {
    const cd = getNextAnniversary(a.date, now);
    return cd.kind === "today" || (cd.kind === "upcoming" && cd.days <= 30);
  }).length;
  const activeItems = items.filter((i) => i.status === "active").length;
  // Monthly subscription cost normalized (convert yearly/weekly/daily to monthly equivalent in CNY for display).
  // Simple heuristic: assume CNY; if not CNY show currency symbol alongside.
  const monthlySubCost = (() => {
    let total = 0;
    for (const s of subs) {
      if (s.priceCents == null) continue;
      const perUnit = s.priceCents / Math.max(1, s.cycleInterval);
      let monthly = perUnit;
      if (s.cycleUnit === "day") monthly = perUnit * 30;
      else if (s.cycleUnit === "week") monthly = (perUnit * 52) / 12;
      else if (s.cycleUnit === "year") monthly = perUnit / 12;
      total += monthly;
    }
    return Math.round(total);
  })();

  // Upcoming next 14 days
  const upcoming: UpcomingEntry[] = [];
  for (const t of todos) {
    if (t.isDone || !t.dueAt) continue;
    const due = new Date(t.dueAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (d >= 0 && d <= 14) {
      upcoming.push({ kind: "todo", id: t.id, title: t.title, daysUntil: d, dueAt: t.dueAt });
    }
  }
  for (const a of anniversaries) {
    const cd = getNextAnniversary(a.date, now);
    if (cd.kind === "today") upcoming.push({ kind: "anniversary", id: a.id, title: a.title, daysUntil: 0, date: a.date });
    else if (cd.kind === "upcoming" && cd.days <= 14)
      upcoming.push({ kind: "anniversary", id: a.id, title: a.title, daysUntil: cd.days, date: a.date });
  }
  for (const s of subs) {
    const d = daysUntil(s.nextRenewDate, now);
    if (d != null && d >= 0 && d <= 14) {
      upcoming.push({
        kind: "subscription",
        id: s.id,
        name: s.name,
        daysUntil: d,
        date: s.nextRenewDate,
        priceCents: s.priceCents,
        currency: s.currency,
      });
    }
  }
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  if (loading) {
    return (
      <div className="h-full scroll-area p-6">
        <div className="max-w-5xl space-y-6">
          <DeferredSkeleton>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl mt-6" />
          </DeferredSkeleton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full scroll-area p-6">
      <div className="max-w-5xl space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            icon="ri:task-line"
            label="未完成待办"
            value={openTodos}
            tone="brand"
            onClick={() => onNavigate("todo")}
          />
          <StatCard
            icon="ri:calendar-event-line"
            label="30 天内纪念日"
            value={upcomingAnniversaries}
            tone="brand"
            onClick={() => onNavigate("anniversary")}
          />
          <StatCard
            icon="ri:bank-card-line"
            label="月均订阅支出"
            value={monthlySubCost > 0 ? `¥${(monthlySubCost / 100).toFixed(0)}` : "—"}
            hint={`${subs.filter((s) => !s.isArchived).length} 个订阅`}
            tone="muted"
            onClick={() => onNavigate("subscription")}
          />
          <StatCard
            icon="ri:box-3-line"
            label="在用物品"
            value={activeItems}
            tone="muted"
            onClick={() => onNavigate("item")}
          />
        </div>

        {/* Upcoming */}
        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
            <h2 className="text-sm font-semibold">未来 14 天</h2>
            <span className="text-xs text-muted-foreground">
              {upcoming.length > 0 ? `${upcoming.length} 项` : "暂无安排"}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Icon icon="ri:zzz-line" className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">暂无即将到来的事项</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((u) => (
                <li key={`${u.kind}-${u.id}`} className="flex items-center gap-3 px-5 py-3">
                  <UpcomingIcon kind={u.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.kind === "subscription" ? u.name : u.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {u.kind === "todo"
                        ? new Date(u.dueAt).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : u.date}
                      {u.kind === "subscription" && u.priceCents != null && (
                        <span className="ml-2 font-mono">
                          {formatPrice(u.priceCents, u.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      u.daysUntil === 0
                        ? "bg-brand-primary text-white"
                        : u.daysUntil <= 3
                        ? "bg-brand-primary/15 text-brand-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.daysUntil === 0 ? "今天" : `${u.daysUntil} 天`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  tone: "brand" | "muted";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-4 rounded-2xl bg-card border border-border hover:border-brand-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            tone === "brand"
              ? "bg-brand-primary/10"
              : "bg-muted"
          }`}
        >
          <Icon
            icon={icon}
            className={`h-4 w-4 ${tone === "brand" ? "text-brand-primary" : "text-muted-foreground"}`}
          />
        </div>
        <Icon
          icon="ri:arrow-right-s-line"
          className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="text-2xl font-semibold font-display tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{hint}</div>}
    </button>
  );
}

function UpcomingIcon({ kind }: { kind: UpcomingEntry["kind"] }) {
  const map = {
    todo: { icon: "ri:task-line", bg: "bg-brand-primary/10", color: "text-brand-primary" },
    anniversary: { icon: "ri:calendar-event-line", bg: "bg-pink-500/10", color: "text-pink-500" },
    subscription: { icon: "ri:bank-card-line", bg: "bg-purple-500/10", color: "text-purple-500" },
  } as const;
  const cfg = map[kind];
  return (
    <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
      <Icon icon={cfg.icon} className={`h-4 w-4 ${cfg.color}`} />
    </div>
  );
}
