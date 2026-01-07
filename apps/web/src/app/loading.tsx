import { AppHeader } from "@/app/_components/AppHeader";

export default function Loading() {
    return (
        <div className="min-h-dvh bg-base font-sans text-primary">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                {/* Header Skeleton */}
                <div className="mb-8 animate-pulse">
                    <div className="h-8 w-32 rounded-lg bg-surface" />
                    <div className="mt-2 h-4 w-64 rounded bg-surface" />
                </div>

                {/* Content Skeleton */}
                <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm animate-pulse">
                    <div className="flex gap-4">
                        <div className="h-10 w-full rounded-lg bg-surface" />
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="h-32 rounded-xl border border-default bg-elevated p-4 shadow-sm animate-pulse"
                        >
                            <div className="mb-4 h-6 w-3/4 rounded bg-surface" />
                            <div className="h-4 w-1/2 rounded bg-surface" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
