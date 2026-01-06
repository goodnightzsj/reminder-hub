"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "./Toast";

export function ToastListener() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { success, error } = useToast();
    // Prevent double toast on strict mode or re-renders
    const processedRef = useRef<string | null>(null);

    useEffect(() => {
        const saved = searchParams.get("saved");
        const errorMsg = searchParams.get("error");
        const backupImported = searchParams.get("backupImported");
        const backupMerged = searchParams.get("backupMerged");
        const testChannel = searchParams.get("testChannel");
        const test = searchParams.get("test");

        // Construct a key to track processed params
        const key = searchParams.toString();
        if (processedRef.current === key) return;

        let hasAction = false;

        if (saved) {
            success("设置已保存");
            hasAction = true;
        }

        if (backupImported) {
            const stats = [
                `Todo ${searchParams.get("backupTodos") || 0}`,
                `子任务 ${searchParams.get("backupSubtasks") || 0}`,
                `纪念日 ${searchParams.get("backupAnniversaries") || 0}`,
                `订阅 ${searchParams.get("backupSubscriptions") || 0}`,
                `物品 ${searchParams.get("backupItems") || 0}`,
            ].join(" · ");
            success(`备份导入成功 (覆盖): ${stats}`);
            hasAction = true;
        }

        if (backupMerged) {
            const stats = [
                `新增 Todo ${searchParams.get("backupTodos") || 0}`,
                `子任务 ${searchParams.get("backupSubtasks") || 0}`,
                `纪念日 ${searchParams.get("backupAnniversaries") || 0}`,
                `订阅 ${searchParams.get("backupSubscriptions") || 0}`,
                `物品 ${searchParams.get("backupItems") || 0}`,
            ].join(" · ");
            success(`备份导入成功 (合并): ${stats}`);
            hasAction = true;
        }

        const notifySent = searchParams.get("notifySent");
        if (notifySent || searchParams.get("notifyFailed")) {
            const ch = searchParams.get("notifyChannel");
            const msg = `发送 ${notifySent} · 失败 ${searchParams.get("notifyFailed") || 0} · 跳过 ${searchParams.get("notifySkipped") || 0}`;
            success(`通知执行完毕${ch ? ` (${ch})` : ""}: ${msg}`);
            hasAction = true;
        }

        if (searchParams.get("notifyCleared")) {
            success("失败记录已清理");
            hasAction = true;
        }

        if (testChannel && test === "1") {
            success(`测试通知已发送 (${testChannel})`);
            hasAction = true;
        } else if (testChannel && test !== "1") {
            error(`测试通知发送失败 (${testChannel})`);
            hasAction = true;
        }

        if (errorMsg) {
            error(getErrorMessage(errorMsg));
            hasAction = true;
        }

        if (hasAction) {
            processedRef.current = key;
            // Cleanup params
            const params = new URLSearchParams(searchParams);
            params.delete("saved");
            params.delete("error");
            params.delete("backupImported");
            params.delete("backupMerged");
            // Cleanup stats params
            params.delete("backupTodos");
            params.delete("backupSubtasks");
            params.delete("backupAnniversaries");
            params.delete("backupSubscriptions");
            params.delete("backupItems");
            params.delete("backupDeliveries");

            params.delete("notifySent");
            params.delete("notifyFailed");
            params.delete("notifySkipped");
            params.delete("notifyChannel");
            params.delete("notifyCleared");

            // Actually keeping stats params might be needed if we want to show stats in toast. 
            // For now, I'll just clean the trigger params.
            params.delete("testChannel");
            params.delete("test");
            params.delete("testMessage");

            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [searchParams, pathname, router, success, error]);

    return null;
}

function getErrorMessage(code: string) {
    const map: Record<string, string> = {
        "missing-timezone": "请填写时区",
        "invalid-timezone": "时区无效，请使用 IANA 名称",
        "missing-date-reminder-time": "请填写日期类默认提醒时刻",
        "invalid-date-reminder-time": "日期类默认提醒时刻无效",
        "backup-missing-file": "请选择一个备份文件",
        "backup-invalid-json": "备份文件不是合法 JSON",
        "backup-invalid-format": "备份格式不正确",
        "backup-invalid-timezone": "备份内的时区无效",
        "backup-import-failed": "导入失败",
        "missing-webhook-url": "Webhook 已开启，但未填写 URL",
        "invalid-webhook-url": "Webhook URL 无效",
        "webhook-disabled": "Webhook 未开启",
        "telegram-disabled": "Telegram 未开启",
        "missing-telegram-token": "Telegram Bot Token 未填写",
        "missing-telegram-chat-id": "Telegram Chat ID 未填写",
        "wecom-disabled": "企业微信未开启",
        "missing-wecom-webhook-url": "企业微信 Webhook URL 未填写",
        "invalid-wecom-webhook-url": "企业微信 Webhook URL 无效",
        "email-disabled": "邮件未开启",
        "missing-smtp-host": "SMTP Host 未填写",
        "missing-smtp-auth": "SMTP 账号/密码不完整",
        "invalid-smtp-port": "SMTP Port 无效",
    };
    return map[code] || `发生错误: ${code}`;
}
