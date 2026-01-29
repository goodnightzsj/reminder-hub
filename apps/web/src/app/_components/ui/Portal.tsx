"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type PortalProps = {
    children: ReactNode;
    container?: Element | DocumentFragment | null;
};

export function Portal({ children, container }: PortalProps) {
    if (typeof document === "undefined") return null;
    const portalRoot = container ?? document.body;
    if (!portalRoot) return null;
    return createPortal(children, portalRoot);
}

