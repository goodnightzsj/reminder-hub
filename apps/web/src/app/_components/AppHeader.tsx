import { Icons } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";
import { MainNav } from "./MainNav";

type AppHeaderProps = {
    title: string;
    description: React.ReactNode;
};

export function AppHeader({ title, description }: AppHeaderProps) {
    return (
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between animate-fade-in">
            <div className="flex-1 flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">
                        {title}
                    </h1>
                    <div className="text-sm text-muted">
                        {description}
                    </div>
                </div>

                {/* Mobile Top Right Actions */}
                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <a
                        href="/settings"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-interactive-hover hover:text-primary active-press"
                        aria-label="Settings"
                    >
                        <Icons.Settings className="h-4.5 w-4.5" />
                    </a>
                </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-4">
                <MainNav />
                <div className="h-4 w-px bg-divider" />
                <ThemeToggle />
            </div>
        </header>
    );
}
