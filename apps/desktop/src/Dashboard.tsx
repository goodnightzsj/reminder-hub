import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type { DataStore, SyncEngine, TodoRecord } from "@reminder-hub/datastore";
import type { AppConfig } from "./lib/app-config";

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
  const [syncStatus, setSyncStatus] = useState<string>("");

  const runSync = async () => {
    if (!syncEngine) return;
    setSyncStatus("同步中");
    const result = await syncEngine.run();
    if (result.kind === "success") {
      setSyncStatus(`上传 ${result.uploaded} · 下载 ${result.downloaded}`);
    } else if (result.kind === "error") {
      setSyncStatus(`失败: ${result.message.slice(0, 40)}`);
    }
    setTimeout(() => setSyncStatus(""), 5000);
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
              className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Icon icon="ri:refresh-line" className="h-4 w-4 shrink-0" />
              <span className="truncate">{syncStatus || "同步"}</span>
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
          {tab === "todo" && <TodoPanel store={store} />}
          {tab === "anniversary" && <Placeholder icon="ri:calendar-event-line" label="纪念日" />}
          {tab === "subscription" && <Placeholder icon="ri:bank-card-line" label="订阅" />}
          {tab === "item" && <Placeholder icon="ri:box-3-line" label="物品" />}
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

  const refresh = async () => {
    const rows = await store.listTodos();
    setTodos(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [store]);

  const add = async () => {
    if (!newTitle.trim()) return;
    await store.createTodo({ title: newTitle.trim() });
    setNewTitle("");
    await refresh();
  };

  const toggle = async (t: TodoRecord) => {
    await store.updateTodo(t.id, { isDone: !t.isDone });
    await refresh();
  };

  const remove = async (id: string) => {
    await store.deleteTodo(id);
    await refresh();
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
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <Icon icon="line-md:loading-twotone-loop" className="h-5 w-5 mr-2" />
            加载中
          </div>
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
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all"
                >
                  <Icon icon="ri:delete-bin-line" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Placeholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <EmptyState icon={icon} title={`${label}模块`} subtitle="在 Web 端管理或后续版本补全" />
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
