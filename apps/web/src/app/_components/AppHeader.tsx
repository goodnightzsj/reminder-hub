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
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-interactive-hover hover:text-primary"
                        aria-label="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
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
