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
        <header className="sticky top-0 z-50 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between animate-fade-in bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-6 md:px-6">
            <div className="flex-1 flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold tracking-tight text-primary">
                        {title}
                    </h1>
                    {description && (
                        <div className="text-sm text-muted">
                            {description}
                        </div>
                    )}
                </div>

                {/* Mobile Top Right Actions */}
                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <a
                        href={ROUTES.settings}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-interactive-hover hover:text-primary active-press"
                        aria-label="Settings"
                    >
                        <IconSettings className="h-4.5 w-4.5" />
                    </a>
                </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-4">
                {children}
                <div className="h-6 w-px bg-divider/50" />
                <MainNav />
                <div className="h-4 w-px bg-divider" />
                <ThemeToggle />
            </div>
        </header>
    );
}
