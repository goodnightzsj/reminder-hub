"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MODAL_CREATE_VALUE, MODAL_QUERY_KEY, removeSearchParamFromPathname } from "../../../lib/url";

export function useCreateModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isOpen = searchParams.get(MODAL_QUERY_KEY) === MODAL_CREATE_VALUE;

  const close = useCallback(() => {
    router.replace(
      removeSearchParamFromPathname(pathname, searchParams.toString(), MODAL_QUERY_KEY),
    );
  }, [pathname, router, searchParams]);

  const closeIfOpen = useCallback(() => {
    if (!isOpen) return;
    close();
  }, [close, isOpen]);

  return { isOpen, close, closeIfOpen };
}
