"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/app/_components/Toast";

export function SubscriptionToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { success } = useToast();
    const handledRef = useRef(false);

    useEffect(() => {
        const action = searchParams.get("action");
        if (action === "updated") {
            if (handledRef.current) return;
            handledRef.current = true;
            success("订阅已更新");
            // Remove param to prevent toast on refresh
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            router.replace(`${pathname}?${params.toString()}`);
        } else {
            handledRef.current = false;
        }
    }, [searchParams, router, pathname, success]);

    return null;
}
