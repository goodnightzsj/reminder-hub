import Link from "next/link";
import { desc } from "drizzle-orm";

import { Badge } from "@/app/_components/Badge";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { AppHeader } from "@/app/_components/AppHeader";
import { ToastListener } from "@/app/_components/ToastListener";
import { getAppSettings } from "@/server/db/settings";


// Notifications moved to /settings/notifications
import { importBackupMerge, importBackupOverwrite } from "../_actions/backup";
import { clearAllData } from "../_actions/settings";
import { DateReminderForm } from "../_components/settings/DateReminderForm";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};



export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="min-h-screen bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="设置"
          description="个人版默认无鉴权，建议仅本机/内网使用。"
        />

        <ToastListener />

        {/* 
        <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <h2 className="text-sm font-medium">时区 (默认)</h2>
          <p className="mt-1 text-xs text-secondary">
            影响 Todo 截止时间及提醒调度。已锁定为上海时间。
          </p>

          <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
            当前时区：<code className="font-mono">{settings.timeZone}</code>
            <span className="mx-2 text-zinc-400">·</span>
            当前时间：{nowText}
          </div>
        </section> 
        */}

        <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <h2 className="text-sm font-medium">日期类提醒</h2>
          <p className="mt-1 text-xs text-secondary">
            纪念日/订阅等“只填日期”的提醒，会在该时刻触发。
          </p>

          <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
            默认提醒时刻：<code className="font-mono">{settings.dateReminderTime}</code>
          </div>

          <DateReminderForm initialTime={settings.dateReminderTime} />
        </section>

        <Link
          href="/settings/notifications"
          className="mt-6 flex items-center justify-between rounded-xl border border-default bg-elevated p-4 shadow-sm hover:border-brand-primary/50 transition-colors group"
        >
          <div>
            <h2 className="text-sm font-medium group-hover:text-brand-primary">通知配置 →</h2>
            <p className="mt-1 text-xs text-secondary">
              配置 Telegram, Webhook, 企业微信, 邮件等消息推送渠道。
            </p>
          </div>
        </Link>

        {/* Backup Section */}
        <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <h2 className="text-sm font-medium">备份（导出 / 导入）</h2>
          <p className="mt-1 text-xs text-secondary">
            导入为“覆盖导入”：会清空并恢复 Todo / 子任务 / 纪念日 / 订阅 / 物品 /
            通知记录；不会包含通知渠道密钥（Token/SMTP 密码等）。
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href="/api/backup/export"
              className="h-9 rounded-lg border border-default px-3 text-xs font-medium leading-9 hover:bg-interactive-hover"
            >
              下载 JSON 备份
            </a>
          </div>

          <form action={importBackupOverwrite} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-secondary">
              选择备份文件（.json）
              <input
                type="file"
                name="backupFile"
                accept="application/json"
                required
                className="block w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-zinc-700 dark:file:bg-zinc-50 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
              />
            </label>

            <ConfirmSubmitButton
              confirmMessage="确定用备份覆盖当前所有数据吗？此操作不可撤销。"
              className="h-11 self-start rounded-lg border border-danger bg-danger px-4 text-sm font-medium text-danger hover:bg-danger-hover"
            >
              覆盖导入
            </ConfirmSubmitButton>
          </form>

          <form action={importBackupMerge} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-secondary">
              选择备份文件（.json）
              <input
                type="file"
                name="backupFile"
                accept="application/json"
                required
                className="block w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-brand-secondary"
              />
            </label>

            <ConfirmSubmitButton
              confirmMessage="确定将备份合并到当前数据吗？相同 ID 的记录会被跳过，不会覆盖。"
              className="h-11 self-start rounded-lg border border-default bg-elevated px-4 text-sm font-medium text-primary hover:bg-interactive-hover"
            >
              合并导入（跳过重复）
            </ConfirmSubmitButton>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-danger bg-danger p-4 shadow-sm">
          <h2 className="text-sm font-medium text-danger">
            危险操作
          </h2>
          <p className="mt-1 text-xs text-danger opacity-80">
            清空所有数据（Todo/纪念日/订阅/物品/通知记录）。此操作不可撤销。
          </p>

          <form action={clearAllData} className="mt-3">
            <ConfirmSubmitButton
              confirmMessage="确定清空所有数据吗？此操作不可撤销。"
              className="h-11 rounded-lg border border-danger bg-base px-4 text-sm font-medium text-danger hover:bg-danger-hover"
            >
              清空所有数据
            </ConfirmSubmitButton>
          </form>
        </section>
      </main>
    </div>
  );
}
