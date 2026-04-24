"use client";

import { m as motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type PageTransitionProps = {
    children: ReactNode;
};

/**
 * 页面过渡动画包装器。
 * 使用 Next.js 的 template.tsx 机制，每次路由切换时触发 mount/unmount。
 *
 * 注意：使用 usePathname 作为 key，只在路径变化时触发动画，
 * 而不是每次 query param 变化都触发（避免 filter 切换时闪烁）。
 *
 * 对于使用 `position: fixed` 全屏布局的路由（如 /login），必须跳过 motion.div。
 * 原因：motion.div 会应用 `transform`（来自 initial/animate 的 scale + y），
 * 而 CSS 规范下祖先有 transform 会成为 fixed 后代的新 containing block，
 * 导致 `fixed inset-0` 相对于 motion.div 而非视口定位，表现为"先在顶部后到中间"。
 */
const FIXED_LAYOUT_PATHS = new Set(["/login"]);

export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    if (FIXED_LAYOUT_PATHS.has(pathname)) {
        return <>{children}</>;
    }

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.4,
                ease: [0.33, 1, 0.68, 1], // Quart ease out for extra smoothness
            }}
        >
            {children}
        </motion.div>
    );
}

