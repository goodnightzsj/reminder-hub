import { PageHeaderSkeleton } from "../_components/shared/ListSkeleton";

export default function DashboardLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in pb-20 sm:pb-10">
            <main className="mx-auto max-w-5xl py-10 px-fluid">
                <PageHeaderSkeleton />
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
                    {/* 大卡片：今天聚焦 2x2 */}
                    <div className="h-[260px] rounded-2xl border border-default bg-elevated p-5 shadow-sm sm:col-span-2 sm:row-span-2 relative overflow-hidden">
                        <div className="h-5 w-24 rounded skeleton-shimmer mb-3" />
                        <div className="space-y-2">
                            <div className="h-4 w-4/5 rounded skeleton-shimmer opacity-70" />
                            <div className="h-4 w-3/5 rounded skeleton-shimmer opacity-60" />
                            <div className="h-4 w-2/3 rounded skeleton-shimmer opacity-50" />
                        </div>
                    </div>
                    {/* 4 个统计卡 */}
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl border border-default bg-elevated p-5 shadow-sm overflow-hidden">
                            <div className="h-12 w-12 rounded-2xl skeleton-shimmer mb-3" />
                            <div className="h-7 w-16 rounded skeleton-shimmer" />
                            <div className="mt-1.5 h-3 w-20 rounded skeleton-shimmer opacity-60" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
