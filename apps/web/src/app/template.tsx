import { PageTransition } from "./_components/layout/PageTransition";

/**
 * Next.js template.tsx - 每次路由切换时会重新 mount。
 * 这确保了 PageTransition 动画能在每次导航时触发。
 */
export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransition>{children}</PageTransition>;
}
