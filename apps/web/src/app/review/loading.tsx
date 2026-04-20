import { CardGridSkeleton, PageHeaderSkeleton } from "../_components/shared/ListSkeleton";

export default function ReviewLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                <PageHeaderSkeleton />
                <div className="mt-4">
                    <CardGridSkeleton count={4} height={120} />
                </div>
            </main>
        </div>
    );
}
