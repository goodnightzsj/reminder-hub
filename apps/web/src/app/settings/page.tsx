import { Icon } from "@iconify/react";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { AppHeader } from "../_components/layout/AppHeader";
import { getAppSettings } from "@/server/db/settings";
import { NotificationSettingsSection } from "@/app/_components/settings/NotificationSettingsSection";
import type { AppSettings as NotificationSettings } from "@/app/_components/settings/NotificationChannelForms";

import { importBackupMerge, importBackupOverwrite } from "../_actions/backup";
import { clearAllData } from "../_actions/settings";
import { DateReminderForm } from "../_components/settings/DateReminderForm";
import { ThemeSwitcher } from "../_components/ThemeSwitcher";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const notificationSettings: NotificationSettings = {
    telegramEnabled: settings.telegramEnabled,
    telegramChatId: settings.telegramChatId,
    telegramHasBotToken: !!settings.telegramBotToken,
    webhookEnabled: settings.webhookEnabled,
    webhookUrl: settings.webhookUrl,
    wecomEnabled: settings.wecomEnabled,
    wecomWebhookUrl: settings.wecomWebhookUrl,
    emailEnabled: settings.emailEnabled,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure ?? false,
    smtpUser: settings.smtpUser,
    smtpHasPass: !!settings.smtpPass,
    smtpFrom: settings.smtpFrom,
    smtpTo: settings.smtpTo,
  };

  return (
    <div className="min-h-dvh bg-base font-sans text-primary pb-20">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="设置"
          description="管理应用外观、通知渠道、数据备份及其他偏好设置。"
        />

        <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">

          {/* 1. 外观设置 */}
          <section className="rounded-2xl border border-default bg-elevated p-6 shadow-sm hover:shadow-md transition-shadow animate-slide-up stagger-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 rounded-full bg-gradient-to-b from-brand-primary to-brand-secondary" />
              <span className="text-sm font-semibold">外观主题</span>
            </div>
            <ThemeSwitcher />
          </section>

          {/* 2. 日期类提醒 */}
          <section className="rounded-2xl border border-default bg-elevated p-6 shadow-sm hover:shadow-md transition-shadow animate-slide-up stagger-2 flex flex-col justify-center">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="ri:calendar-event-line" className="text-brand-primary" />
                  <span className="text-sm font-semibold">日期默认提醒</span>
                </div>
                <p className="text-xs text-secondary">
                  无具体时间的纪念日/订阅将在此刻触发。
                </p>
              </div>
              <DateReminderForm initialTime={settings.dateReminderTime} />
            </div>
          </section>

          {/* 3. 通知渠道 (占满两列) */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up stagger-3">
            <div className="flex items-center gap-2 px-1">
              <Icon icon="ri:notification-3-line" className="text-brand-primary h-5 w-5" />
              <span className="text-sm font-bold">通知渠道</span>
            </div>
            <NotificationSettingsSection settings={notificationSettings} />
          </div>

          {/* 4. 备份与恢复 (占满两列) */}
          <section className="lg:col-span-2 rounded-2xl border border-default bg-elevated p-6 shadow-sm hover:shadow-md transition-shadow animate-slide-up stagger-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 rounded-full bg-gradient-to-b from-brand-primary to-brand-secondary" />
              <span className="text-sm font-semibold">备份与恢复</span>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center gap-6">
              {/* 导出 */}
              <div className="shrink-0">
                <p className="text-xs text-secondary mb-2">保存当前数据快照</p>
                <a
                  href="/api/backup/export"
                  className="inline-flex h-10 w-full xl:w-auto items-center justify-center gap-2 rounded-lg border border-default bg-surface px-4 text-sm font-medium hover:bg-interactive-hover transition-colors active-press"
                >
                  <Icon icon="ri:download-cloud-2-line" className="h-4 w-4" />
                  下载备份 (.json)
                </a>
              </div>

              <div className="hidden xl:block h-12 w-px bg-divider mx-2"></div>
              <div className="xl:hidden w-full h-px bg-divider"></div>

              {/* 导入 */}
              <div className="flex-1">
                <p className="text-xs text-secondary mb-2">从备份文件恢复</p>
                <form className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <input
                    type="file"
                    name="backupFile"
                    accept="application/json"
                    required
                    className="block w-full sm:flex-1 rounded-lg border border-default bg-transparent px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-interactive-hover cursor-pointer"
                  />

                  <div className="flex gap-2 w-full sm:w-auto">
                    <ConfirmSubmitButton
                      formAction={importBackupOverwrite}
                      confirmMessage="⚠️ 警告：这将清除当前所有数据并用备份覆盖！此操作不可撤销。"
                      className="h-10 flex-1 sm:flex-none rounded-lg bg-danger px-4 text-xs font-medium text-white hover:bg-danger/90 transition-colors active-press shadow-sm shadow-danger/20"
                    >
                      覆盖导入
                    </ConfirmSubmitButton>

                    <ConfirmSubmitButton
                      formAction={importBackupMerge}
                      confirmMessage="确定将备份合并到当前数据吗？相同 ID 的记录会被跳过。"
                      className="h-10 flex-1 sm:flex-none rounded-lg border border-default bg-surface px-4 text-xs font-medium text-primary hover:bg-interactive-hover transition-colors active-press"
                    >
                      合并导入
                    </ConfirmSubmitButton>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* 5. 危险区域 */}
          <section className="lg:col-span-2 mt-4 rounded-2xl border border-danger/20 bg-danger/5 p-6 animate-slide-up stagger-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-danger flex items-center gap-2">
                  <Icon icon="ri:alarm-warning-line" />
                  危险操作区
                </span>
                <p className="text-xs text-danger/70 mt-1">
                  清空所有数据（Todo、纪念日、订阅、物品及通知记录）。一旦执行无法撤销。
                </p>
              </div>
              <form action={clearAllData}>
                <ConfirmSubmitButton
                  confirmMessage="🚨 最终确认：确定清空所有数据吗？此操作不可撤销！"
                  className="h-9 w-full sm:w-auto whitespace-nowrap rounded-lg border border-danger bg-danger px-4 text-xs font-medium text-white hover:bg-danger-hover active-press"
                >
                  清空所有数据
                </ConfirmSubmitButton>
              </form>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
