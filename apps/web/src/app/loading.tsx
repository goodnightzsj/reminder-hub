export default function Loading() {
    return (
        <div className="min-h-dvh bg-base font-sans text-primary">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                {/* Header Skeleton */}
                <div className="mb-8 space-y-3">
                    <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
                    <div className="h-4 w-64 rounded skeleton-shimmer" />
                </div>

                {/* Content Skeleton */}
                <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm overflow-hidden">
                    <div className="flex gap-4">
                        <div className="h-10 w-full rounded-lg skeleton-shimmer" />
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="h-32 rounded-xl border border-default bg-elevated p-4 shadow-sm overflow-hidden"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="mb-4 h-6 w-3/4 rounded skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                            <div className="h-4 w-1/2 rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
