import { ListSkeleton, PageHeaderSkeleton } from "../_components/shared/ListSkeleton";

export default function SearchLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                <PageHeaderSkeleton />
                <section className="mb-8 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <div className="flex gap-3">
                        <div className="h-11 flex-1 rounded skeleton-shimmer" />
                        <div className="h-11 w-24 rounded skeleton-shimmer opacity-70" />
                    </div>
                </section>
                <ListSkeleton rows={5} />
            </main>
        </div>
    );
}
