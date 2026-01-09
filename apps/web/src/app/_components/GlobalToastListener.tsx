"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/app/_components/Toast";

const ACTION_MESSAGES: Record<string, string> = {
    created: "创建成功",
    updated: "保存成功",
    deleted: "已删除",
    restored: "已撤销删除",
};

export function GlobalToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { success } = useToast();
    const handledRef = useRef<string | null>(null);

    useEffect(() => {
        const action = searchParams.get("action");
        if (action && ACTION_MESSAGES[action]) {
            // Prevent duplicate toasts for the same action instance
            // We use the full query string or a combination to track uniqueness if needed.
            // But simple ref check for 'current action param value' is often enough if param sticks.
            // However, since we remove the param, ref check against 'action' string is risky if user does same action twice?
            // No, because param is removed.

            if (handledRef.current === action) return;
            handledRef.current = action;

            success(ACTION_MESSAGES[action]);

            // Remove param
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            router.replace(`${pathname}?${params.toString()}`);
        } else if (!action) {
            handledRef.current = null;
        }
    }, [searchParams, router, pathname, success]);

    return null;
}
