"use client";

import { motion } from "framer-motion";
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
 */
export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1],
            }}
        >
            {children}
        </motion.div>
    );
}

