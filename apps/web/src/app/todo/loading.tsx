import { ListSkeleton, PageHeaderSkeleton } from "../_components/shared/ListSkeleton";

export default function TodoLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                <PageHeaderSkeleton />
                <div className="mt-4 flex gap-2">
                    <div className="h-9 w-20 rounded-full skeleton-shimmer" />
                    <div className="h-9 w-24 rounded-full skeleton-shimmer opacity-70" />
                    <div className="h-9 w-20 rounded-full skeleton-shimmer opacity-60" />
                </div>
                <div className="mt-4">
                    <ListSkeleton rows={7} withAccent />
                </div>
            </main>
        </div>
    );
}
