import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type { DataStore, SyncEngine, TodoRecord } from "@reminder-hub/datastore";
import type { AppConfig } from "./preferences";
import { useToast } from "./ui/Toast";
import { DeferredSkeleton, TodoListSkeleton } from "./ui/Skeleton";

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
        {tab === "anniversary" && <Placeholder icon="ri:calendar-event-line" label="纪念日" />}
        {tab === "subscription" && <Placeholder icon="ri:bank-card-line" label="订阅" />}
        {tab === "item" && <Placeholder icon="ri:box-3-line" label="物品" />}
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

function Placeholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <EmptyState icon={icon} title={`${label}模块`} subtitle="在 Web 端管理或后续版本补全" />
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
