import Link from "next/link";
import { IconSettings } from "../Icons";
import { ThemeToggle } from "../ThemeToggle";
import { MainNav } from "./MainNav";
import { ROUTES } from "../../../lib/routes";

type AppHeaderProps = {
    title: string;
    description?: React.ReactNode;
    children?: React.ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-50 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between animate-fade-in bg-background/80 backdrop-blur-md pt-safe pb-4 -mx-4 px-4 md:-mx-6 md:px-6 md:pt-4">
            <div className="flex-1 flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0">
                    {/* Display 字体 + 1.5rem 主标题，建立清晰的页面级视觉锚点 */}
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-primary truncate">
                        {title}
                    </h1>
                    {description && (
                        <div className="text-sm text-muted">
                            {description}
                        </div>
                    )}
                </div>

                {/* 移动端右上：主题切换 + 设置。tap 区保证 ≥44px */}
                <div className="flex items-center gap-1 md:hidden">
                    <ThemeToggle />
                    <Link
                        href={ROUTES.settings}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-interactive-hover hover:text-primary active-press"
                        aria-label="打开设置"
                    >
                        <IconSettings aria-hidden="true" className="h-[18px] w-[18px]" />
                    </Link>
                </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-4">
                {children}
                {children && <div className="h-6 w-px bg-divider/50" />}
                <MainNav />
                <div className="h-4 w-px bg-divider" />
                <ThemeToggle />
            </div>
        </header>
    );
}
