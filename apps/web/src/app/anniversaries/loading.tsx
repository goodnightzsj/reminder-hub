import { CardGridSkeleton, PageHeaderSkeleton } from "../_components/shared/ListSkeleton";

export default function AnniversariesLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in">
            <main className="mx-auto max-w-5xl p-6 sm:p-10">
                <PageHeaderSkeleton />
                <div className="mt-4">
                    <CardGridSkeleton count={6} height={220} />
                </div>
            </main>
        </div>
    );
}
