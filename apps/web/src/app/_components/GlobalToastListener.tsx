"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/app/_components/Toast";
import { removeSearchParamsFromPathname } from "@/lib/url";
import {
    FLASH_ACTION_MESSAGES,
    FLASH_FLAG_VALUE_TRUE,
    FLASH_STATUS_MESSAGES,
    FLASH_TOAST_MESSAGES,
    FLASH_TOAST_QUERY_KEY,
    FLASH_TOAST_QUERY_KEYS,
    getFlashErrorMessage,
    isFlashAction,
} from "@/lib/flash";

export function GlobalToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { success, error } = useToast();
    const processedRef = useRef<string | null>(null);

    useEffect(() => {
        const action = searchParams.get(FLASH_TOAST_QUERY_KEY.ACTION);
        const saved = searchParams.get(FLASH_TOAST_QUERY_KEY.SAVED);
        const errorMsg = searchParams.get(FLASH_TOAST_QUERY_KEY.ERROR);
        const dataCleared = searchParams.get(FLASH_TOAST_QUERY_KEY.DATA_CLEARED);

        const backupImported = searchParams.get(FLASH_TOAST_QUERY_KEY.BACKUP_IMPORTED);
        const backupMerged = searchParams.get(FLASH_TOAST_QUERY_KEY.BACKUP_MERGED);
        const backupMessage = searchParams.get(FLASH_TOAST_QUERY_KEY.BACKUP_MESSAGE);

        const notifySent = searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_SENT);
        const notifyFailed = searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_FAILED);
        const notifySummary = searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_SUMMARY);
        const notifyCleared = searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_CLEARED);

        const testChannel = searchParams.get(FLASH_TOAST_QUERY_KEY.TEST_CHANNEL);
        const test = searchParams.get(FLASH_TOAST_QUERY_KEY.TEST);
        const testMessage =
            searchParams.get(FLASH_TOAST_QUERY_KEY.TEST_MESSAGE) ??
            searchParams.get(FLASH_TOAST_QUERY_KEY.MESSAGE);

        const isSaved = saved === FLASH_FLAG_VALUE_TRUE;
        const isDataCleared = dataCleared === FLASH_FLAG_VALUE_TRUE;
        const isBackupImported = backupImported === FLASH_FLAG_VALUE_TRUE;
        const isBackupMerged = backupMerged === FLASH_FLAG_VALUE_TRUE;
        const isNotifyCleared = notifyCleared === FLASH_FLAG_VALUE_TRUE;
        const hasNotifyResults = notifySent !== null || notifyFailed !== null;

        const hasAction =
            (action && isFlashAction(action)) ||
            isSaved ||
            errorMsg ||
            isDataCleared ||
            isBackupImported ||
            isBackupMerged ||
            backupMessage ||
            hasNotifyResults ||
            notifySummary !== null ||
            isNotifyCleared ||
            testChannel;

        const key = searchParams.toString();
        if (!hasAction) {
            processedRef.current = null;
            return;
        }
        if (processedRef.current === key) return;
        processedRef.current = key;

        if (action && isFlashAction(action)) {
            success(FLASH_ACTION_MESSAGES[action]);
        }

        if (isSaved) {
            success(FLASH_STATUS_MESSAGES.SETTINGS_SAVED);
        }

        if (isDataCleared) {
            success(FLASH_STATUS_MESSAGES.SETTINGS_DATA_CLEARED);
        }

        if (isBackupImported) {
            const stats = buildBackupStats(searchParams, { todoLabel: "Todo" });
            success(FLASH_TOAST_MESSAGES.backupImported(stats));
        }

        if (isBackupMerged) {
            const stats = buildBackupStats(searchParams, { todoLabel: "新增 Todo" });
            success(FLASH_TOAST_MESSAGES.backupMerged(stats));
        }

        if (hasNotifyResults) {
            const ch = searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_CHANNEL);
            const msg = `发送 ${notifySent || 0} · 失败 ${notifyFailed || 0} · 跳过 ${searchParams.get(FLASH_TOAST_QUERY_KEY.NOTIFY_SKIPPED) || 0}`;
            success(FLASH_TOAST_MESSAGES.notifyFinished(ch, msg));
        }

        if (notifySummary) {
            success(FLASH_TOAST_MESSAGES.notifyAllFinished(notifySummary.slice(0, 200)));
        }

        if (isNotifyCleared) {
            success(FLASH_STATUS_MESSAGES.NOTIFY_CLEARED);
        }

        if (testChannel && test === FLASH_FLAG_VALUE_TRUE) {
            success(FLASH_TOAST_MESSAGES.testSent(testChannel));
        } else if (testChannel && test !== FLASH_FLAG_VALUE_TRUE) {
            error(FLASH_TOAST_MESSAGES.testFailed(testChannel));
            if (testMessage) {
                error(testMessage.slice(0, 200));
            }
        }

        if (errorMsg) {
            error(getFlashErrorMessage(errorMsg));
        }

        if (backupMessage) {
            error(backupMessage.slice(0, 300));
        }

        router.replace(
            removeSearchParamsFromPathname(pathname, searchParams.toString(), FLASH_TOAST_QUERY_KEYS),
        );
    }, [searchParams, pathname, router, success, error]);

    return null;
}

function buildBackupStats(
    params: { get(key: string): string | null },
    options: { todoLabel: string },
): string {
    const get = (key: string) => params.get(key) || "0";
    return [
        `${options.todoLabel} ${get(FLASH_TOAST_QUERY_KEY.BACKUP_TODOS)}`,
        `子任务 ${get(FLASH_TOAST_QUERY_KEY.BACKUP_SUBTASKS)}`,
        `纪念日 ${get(FLASH_TOAST_QUERY_KEY.BACKUP_ANNIVERSARIES)}`,
        `订阅 ${get(FLASH_TOAST_QUERY_KEY.BACKUP_SUBSCRIPTIONS)}`,
        `物品 ${get(FLASH_TOAST_QUERY_KEY.BACKUP_ITEMS)}`,
        `通知记录 ${get(FLASH_TOAST_QUERY_KEY.BACKUP_DELIVERIES)}`,
    ].join(" · ");
}
