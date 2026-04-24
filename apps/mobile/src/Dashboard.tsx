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
import type { AppConfig } from "./preferences";
import { useToast } from "./ui/Toast";
import { DeferredSkeleton, Skeleton, TodoListSkeleton } from "./ui/Skeleton";

type Tab = "todo" | "anniversary" | "subscription" | "item" | "settings";

type DashboardProps = {
  config: AppConfig;
  store: DataStore;
  syncEngine: SyncEngine | null;
  onLogout: () => Promise<void>;
};

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "todo", label: "待办", icon: "ri:task-line" },
  { id: "anniversary", label: "纪念日", icon: "ri:calendar-event-line" },
  { id: "subscription", label: "订阅", icon: "ri:bank-card-line" },
  { id: "item", label: "物品", icon: "ri:box-3-line" },
  { id: "settings", label: "设置", icon: "ri:settings-3-line" },
];

export function Dashboard({ config, store, syncEngine, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("todo");
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
    <div className="h-full w-full flex flex-col">
      {/* Top bar */}
      <header className="pt-safe px-safe bg-card/60 backdrop-blur border-b border-border/60">
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <Icon icon="ri:shield-keyhole-line" className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {TABS.find((t) => t.id === tab)?.label ?? "Reminder Hub"}
            </span>
          </div>
          {syncEngine && (
            <button
              onClick={runSync}
              disabled={syncing}
              className="tap-scale h-8 px-3 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Icon
                icon={syncing ? "line-md:loading-twotone-loop" : "ri:refresh-line"}
                className="h-3.5 w-3.5"
              />
              {syncing ? "同步中" : "同步"}
            </button>
          )}
        </div>
      </header>

      {/* Scroll area */}
      <main className="flex-1 overflow-hidden">
        {tab === "todo" && <TodoScreen store={store} />}
        {tab === "anniversary" && <AnniversaryScreen store={store} />}
        {tab === "subscription" && <SubscriptionScreen store={store} />}
        {tab === "item" && <ItemScreen store={store} />}
        {tab === "settings" && <SettingsScreen config={config} onLogout={onLogout} />}
      </main>

      {/* Bottom tabs */}
      <nav className="pb-safe px-safe bg-card/80 backdrop-blur border-t border-border/60">
        <div className="h-16 flex items-stretch justify-around px-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 tap-scale"
              >
                <Icon
                  icon={t.icon}
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-brand-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-brand-primary" : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TodoScreen({ store }: { store: DataStore }) {
  const [todos, setTodos] = useState<TodoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
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
      setAdding(false);
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
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <DeferredSkeleton>
            <TodoListSkeleton />
          </DeferredSkeleton>
        ) : todos.length === 0 ? (
          <EmptyState
            icon="ri:task-line"
            title="暂无待办"
            subtitle="点击右下角 + 快速添加"
          />
        ) : (
          <ul className="space-y-2">
            {todos.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border animate-fade-in"
              >
                <button
                  onClick={() => toggle(t)}
                  className={`tap-scale h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    t.isDone
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border"
                  }`}
                >
                  {t.isDone && <Icon icon="ri:check-line" className="h-3.5 w-3.5 text-white" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    t.isDone ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {t.title}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  className="tap-scale h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-danger/10 active:text-danger"
                >
                  <Icon icon="ri:close-line" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add input bottom sheet */}
      {adding && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setAdding(false);
            setNewTitle("");
          }}
        >
          <div
            className="absolute left-0 right-0 bottom-0 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m-3 p-3 rounded-2xl bg-card border border-border shadow-2xl">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="输入待办…"
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdding(false);
                    setNewTitle("");
                  }}
                  className="tap-scale flex-1 h-10 rounded-xl border border-border text-sm"
                >
                  取消
                </button>
                <button
                  onClick={add}
                  disabled={!newTitle.trim()}
                  className="tap-scale flex-1 h-10 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setAdding(true)}
        className="tap-scale absolute right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/40 flex items-center justify-center"
      >
        <Icon icon="ri:add-line" className="h-6 w-6" />
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon icon={icon} className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SettingsScreen({ config, onLogout }: { config: AppConfig; onLogout: () => Promise<void> }) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="space-y-2 mb-6">
        <InfoRow
          icon="ri:database-2-line"
          label="数据模式"
          value={config.mode === "local" ? "本地优先" : "纯云端"}
        />
        <InfoRow
          icon="ri:global-line"
          label="服务器"
          value={config.remoteBaseUrl || "（未配置）"}
        />
        <InfoRow
          icon="ri:shield-check-line"
          label="登录状态"
          value={config.token ? "已登录" : "未登录"}
          valueColor={config.token ? "text-success" : "text-muted-foreground"}
        />
      </div>

      <button
        onClick={onLogout}
        className="tap-scale w-full h-12 rounded-2xl border border-danger/30 text-danger font-medium flex items-center justify-center gap-2"
      >
        <Icon icon="ri:logout-box-r-line" className="h-4 w-4" />
        退出并重新配置
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Reminder Hub Mobile
      </p>
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
    <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <Icon icon={icon} className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-medium truncate ml-3 ${valueColor}`}>{value}</span>
    </div>
  );
}

// --- Anniversary screen --------------------------------------------------

type Countdown =
  | { kind: "today"; label: string }
  | { kind: "upcoming"; days: number; label: string }
  | { kind: "past"; days: number; label: string };

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

function AnniversaryScreen({ store }: { store: DataStore }) {
  const [items, setItems] = useState<AnniversaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listAnniversaries();
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
      setAdding(false);
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
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <DeferredSkeleton>
            <AnniversaryListSkeleton />
          </DeferredSkeleton>
        ) : items.length === 0 ? (
          <EmptyState
            icon="ri:calendar-event-line"
            title="暂无纪念日"
            subtitle="添加生日、周年，每年自动倒计时"
          />
        ) : (
          <ul className="space-y-2">
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
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border animate-fade-in"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center shrink-0">
                    <Icon icon="ri:calendar-event-line" className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.date}</div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                    {cd.label}
                  </span>
                  <button
                    onClick={() => remove(a.id)}
                    className="tap-scale h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-danger/10 active:text-danger"
                  >
                    <Icon icon="ri:close-line" className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bottom-sheet add overlay */}
      {adding && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setAdding(false);
            setTitle("");
            setDate("");
          }}
        >
          <div
            className="absolute left-0 right-0 bottom-0 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m-3 p-3 rounded-2xl bg-card border border-border shadow-2xl">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="纪念日标题…"
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none mb-2"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdding(false);
                    setTitle("");
                    setDate("");
                  }}
                  className="tap-scale flex-1 h-10 rounded-xl border border-border text-sm"
                >
                  取消
                </button>
                <button
                  onClick={add}
                  disabled={!title.trim() || !date}
                  className="tap-scale flex-1 h-10 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        className="tap-scale absolute right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/40 flex items-center justify-center"
      >
        <Icon icon="ri:add-line" className="h-6 w-6" />
      </button>
    </div>
  );
}

function AnniversaryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border"
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4" style={{ maxWidth: `${45 + ((i * 13) % 30)}%` }} />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

// --- Subscription screen (mobile) ---------------------------------------

const SUB_CYCLE_UNITS: Array<{ value: "day" | "week" | "month" | "year"; label: string }> = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
];

const SUB_CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  HKD: "HK$",
};

function formatSubPrice(priceCents: number | null, currency: string): string {
  if (priceCents == null) return "—";
  const symbol = SUB_CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${(priceCents / 100).toFixed(2)}`;
}

function subDaysUntil(dateStr: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function SubscriptionScreen({ store }: { store: DataStore }) {
  const [items, setItems] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [priceYuan, setPriceYuan] = useState("");
  const [cycleUnit, setCycleUnit] = useState<"day" | "week" | "month" | "year">("month");
  const [nextRenewDate, setNextRenewDate] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const toast = useToast();

  const refresh = async () => {
    try {
      const rows = await store.listSubscriptions();
      rows.sort((a, b) => (subDaysUntil(a.nextRenewDate) ?? 9999) - (subDaysUntil(b.nextRenewDate) ?? 9999));
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
      setAdding(false);
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
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <DeferredSkeleton>
            <AnniversaryListSkeleton />
          </DeferredSkeleton>
        ) : items.length === 0 ? (
          <EmptyState
            icon="ri:bank-card-line"
            title="暂无订阅"
            subtitle="记录月/年费，到期自动提醒"
          />
        ) : (
          <ul className="space-y-2">
            {items.map((s) => {
              const d = subDaysUntil(s.nextRenewDate);
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
                  ? "今天"
                  : `${d} 天后`;
              const unitLabel = SUB_CYCLE_UNITS.find((u) => u.value === s.cycleUnit)?.label ?? "月";
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border animate-fade-in"
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
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{formatSubPrice(s.priceCents, s.currency)}</span>
                      <span className="opacity-60"> · 每{unitLabel}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                  <button
                    onClick={() => remove(s.id)}
                    className="tap-scale h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-danger/10 active:text-danger"
                  >
                    <Icon icon="ri:close-line" className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {adding && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setAdding(false)}
        >
          <div
            className="absolute left-0 right-0 bottom-0 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m-3 p-3 rounded-2xl bg-card border border-border shadow-2xl space-y-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="订阅名称（如 Spotify）"
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 rounded-xl bg-muted px-3 text-sm outline-none"
                >
                  {Object.keys(SUB_CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c}>
                      {SUB_CURRENCY_SYMBOLS[c]} {c}
                    </option>
                  ))}
                </select>
                <input
                  value={priceYuan}
                  onChange={(e) => setPriceYuan(e.target.value)}
                  placeholder="价格"
                  inputMode="decimal"
                  className="h-11 flex-1 rounded-xl bg-muted px-4 text-sm outline-none"
                />
                <select
                  value={cycleUnit}
                  onChange={(e) => setCycleUnit(e.target.value as typeof cycleUnit)}
                  className="h-11 rounded-xl bg-muted px-3 text-sm outline-none"
                >
                  {SUB_CYCLE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      每{u.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="date"
                value={nextRenewDate}
                onChange={(e) => setNextRenewDate(e.target.value)}
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAdding(false)}
                  className="tap-scale flex-1 h-10 rounded-xl border border-border text-sm"
                >
                  取消
                </button>
                <button
                  onClick={add}
                  disabled={!name.trim() || !nextRenewDate}
                  className="tap-scale flex-1 h-10 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        className="tap-scale absolute right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/40 flex items-center justify-center"
      >
        <Icon icon="ri:add-line" className="h-6 w-6" />
      </button>
    </div>
  );
}

// --- Item screen (mobile) -----------------------------------------------

const ITEM_STATUSES: Array<{ value: "active" | "idle" | "retired"; label: string; color: string }> = [
  { value: "active", label: "在用", color: "text-success bg-success/10" },
  { value: "idle", label: "闲置", color: "text-muted-foreground bg-muted" },
  { value: "retired", label: "弃用", color: "text-danger bg-danger/10" },
];

function itemDaysOwned(dateStr: string | null, now = new Date()): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const purchased = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = Math.round((today.getTime() - purchased.getTime()) / 86_400_000);
  return d < 0 ? 0 : d;
}

function itemDailyCost(priceCents: number | null, purchasedDate: string | null, currency: string): string | null {
  const d = itemDaysOwned(purchasedDate);
  if (priceCents == null || d == null || d <= 0) return null;
  const perDay = priceCents / d / 100;
  const symbol = SUB_CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${perDay.toFixed(2)}/天`;
}

function ItemScreen({ store }: { store: DataStore }) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
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
      setAdding(false);
      await refresh();
      toast.show("success", "已添加");
    } catch (e) {
      toast.show("error", `创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const toggleStatus = async (item: ItemRecord) => {
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
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto px-4 py-3">
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
          <ul className="space-y-2">
            {items.map((i) => {
              const owned = itemDaysOwned(i.purchasedDate);
              const dailyCost = itemDailyCost(i.priceCents, i.purchasedDate, i.currency);
              const statusCfg = ITEM_STATUSES.find((s) => s.value === i.status) ?? ITEM_STATUSES[0];
              return (
                <li
                  key={i.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border animate-fade-in"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center shrink-0">
                    <Icon icon="ri:box-3-line" className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono">{formatSubPrice(i.priceCents, i.currency)}</span>
                      {owned != null && (
                        <>
                          <span className="opacity-60">·</span>
                          <span>{owned} 天</span>
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
                    className={`tap-scale text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </button>
                  <button
                    onClick={() => remove(i.id)}
                    className="tap-scale h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-danger/10 active:text-danger"
                  >
                    <Icon icon="ri:close-line" className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {adding && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setAdding(false)}
        >
          <div
            className="absolute left-0 right-0 bottom-0 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m-3 p-3 rounded-2xl bg-card border border-border shadow-2xl space-y-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="物品名称（如 MacBook）"
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 rounded-xl bg-muted px-3 text-sm outline-none"
                >
                  {Object.keys(SUB_CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c}>
                      {SUB_CURRENCY_SYMBOLS[c]} {c}
                    </option>
                  ))}
                </select>
                <input
                  value={priceYuan}
                  onChange={(e) => setPriceYuan(e.target.value)}
                  placeholder="价格"
                  inputMode="decimal"
                  className="h-11 flex-1 rounded-xl bg-muted px-4 text-sm outline-none"
                />
              </div>
              <input
                type="date"
                value={purchasedDate}
                onChange={(e) => setPurchasedDate(e.target.value)}
                className="h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="h-11 w-full rounded-xl bg-muted px-3 text-sm outline-none"
              >
                {ITEM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAdding(false)}
                  className="tap-scale flex-1 h-10 rounded-xl border border-border text-sm"
                >
                  取消
                </button>
                <button
                  onClick={add}
                  disabled={!name.trim()}
                  className="tap-scale flex-1 h-10 rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white text-sm font-medium disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        className="tap-scale absolute right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/40 flex items-center justify-center"
      >
        <Icon icon="ri:add-line" className="h-6 w-6" />
      </button>
    </div>
  );
}
