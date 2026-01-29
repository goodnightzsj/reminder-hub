"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/app/_components/ui/Toast";
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

type ToastHandler = {
    shouldRun: boolean;
    run: () => void;
};

export function GlobalToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { success, error } = useToast();
    const processedRef = useRef<string | null>(null);

    useEffect(() => {
        // 1. Extract all relevant params
        const get = (k: string) => searchParams.get(k);
        const action = get(FLASH_TOAST_QUERY_KEY.ACTION);
        const saved = get(FLASH_TOAST_QUERY_KEY.SAVED);
        const errorMsg = get(FLASH_TOAST_QUERY_KEY.ERROR);
        const dataCleared = get(FLASH_TOAST_QUERY_KEY.DATA_CLEARED);
        const backupImported = get(FLASH_TOAST_QUERY_KEY.BACKUP_IMPORTED);
        const backupMerged = get(FLASH_TOAST_QUERY_KEY.BACKUP_MERGED);
        const backupMessage = get(FLASH_TOAST_QUERY_KEY.BACKUP_MESSAGE);
        const notifySent = get(FLASH_TOAST_QUERY_KEY.NOTIFY_SENT);
        const notifyFailed = get(FLASH_TOAST_QUERY_KEY.NOTIFY_FAILED);
        const notifySummary = get(FLASH_TOAST_QUERY_KEY.NOTIFY_SUMMARY);
        const notifyCleared = get(FLASH_TOAST_QUERY_KEY.NOTIFY_CLEARED);
        const testChannel = get(FLASH_TOAST_QUERY_KEY.TEST_CHANNEL);
        const test = get(FLASH_TOAST_QUERY_KEY.TEST);
        const testMessage = get(FLASH_TOAST_QUERY_KEY.TEST_MESSAGE) ?? get(FLASH_TOAST_QUERY_KEY.MESSAGE);

        // 2. Define flags
        const isSaved = saved === FLASH_FLAG_VALUE_TRUE;
        const isDataCleared = dataCleared === FLASH_FLAG_VALUE_TRUE;
        const isBackupImported = backupImported === FLASH_FLAG_VALUE_TRUE;
        const isBackupMerged = backupMerged === FLASH_FLAG_VALUE_TRUE;
        const isNotifyCleared = notifyCleared === FLASH_FLAG_VALUE_TRUE;
        const hasNotifyResults = notifySent !== null || notifyFailed !== null;

        // 3. Define Handlers
	        const handlers: ToastHandler[] = [
	            {
	                shouldRun: !!action && isFlashAction(action),
	                run: () => {
	                    if (!action) return;
	                    if (!isFlashAction(action)) return;
	                    success(FLASH_ACTION_MESSAGES[action]);
	                },
	            },
	            {
	                shouldRun: isSaved,
	                run: () => success(FLASH_STATUS_MESSAGES.SETTINGS_SAVED),
	            },
            {
                shouldRun: isDataCleared,
                run: () => success(FLASH_STATUS_MESSAGES.SETTINGS_DATA_CLEARED),
            },
            {
                shouldRun: isBackupImported,
                run: () => {
                    const stats = buildBackupStats(searchParams, { todoLabel: "Todo" });
                    success(FLASH_TOAST_MESSAGES.backupImported(stats));
                },
            },
            {
                shouldRun: isBackupMerged,
                run: () => {
                    const stats = buildBackupStats(searchParams, { todoLabel: "新增 Todo" });
                    success(FLASH_TOAST_MESSAGES.backupMerged(stats));
                },
            },
            {
                shouldRun: hasNotifyResults,
                run: () => {
                    const ch = get(FLASH_TOAST_QUERY_KEY.NOTIFY_CHANNEL);
                    const msg = `发送 ${notifySent || 0} · 失败 ${notifyFailed || 0} · 跳过 ${get(FLASH_TOAST_QUERY_KEY.NOTIFY_SKIPPED) || 0}`;
                    success(FLASH_TOAST_MESSAGES.notifyFinished(ch, msg));
                },
            },
            {
                shouldRun: !!notifySummary,
                run: () => notifySummary && success(FLASH_TOAST_MESSAGES.notifyAllFinished(notifySummary.slice(0, 200))),
            },
            {
                shouldRun: isNotifyCleared,
                run: () => success(FLASH_STATUS_MESSAGES.NOTIFY_CLEARED),
            },
            {
                shouldRun: !!testChannel && test === FLASH_FLAG_VALUE_TRUE,
                run: () => testChannel && success(FLASH_TOAST_MESSAGES.testSent(testChannel)),
            },
            {
                shouldRun: !!testChannel && test !== FLASH_FLAG_VALUE_TRUE,
                run: () => {
                    if (testChannel) error(FLASH_TOAST_MESSAGES.testFailed(testChannel));
                    if (testMessage) error(testMessage.slice(0, 200));
                },
            },
            {
                shouldRun: !!errorMsg,
                run: () => errorMsg && error(getFlashErrorMessage(errorMsg)),
            },
            {
                shouldRun: !!backupMessage,
                run: () => backupMessage && error(backupMessage.slice(0, 300)),
            },
        ];

        // 4. Check if any action is needed
        const hasAction = handlers.some(h => h.shouldRun);
        const key = searchParams.toString();

        if (!hasAction) {
            processedRef.current = null;
            return;
        }

        if (processedRef.current === key) return;
        processedRef.current = key;

        // 5. Execute handlers
        handlers.forEach((h) => {
            if (h.shouldRun) h.run();
        });

        // 6. Cleanup URL
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
