/**
 * 详情页骨架：匹配真实 /todo/[id] 的结构（sticky header + 主卡）。
 * 没有这个文件时会 fallback 到 /todo/loading.tsx 的列表骨架，从列表跳进详情会有"list→detail"的跳变。
 */
export default function TodoDetailLoading() {
    return (
        <div className="min-h-dvh bg-base text-primary animate-fade-in">
            <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
                {/* Sticky header 占位 */}
                <div className="sticky top-0 z-20 flex items-center justify-between bg-base/80 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-24 rounded skeleton-shimmer" />
                            <div className="h-3 w-20 rounded skeleton-shimmer opacity-60" />
                        </div>
                    </div>
                    <div className="h-9 w-16 rounded-lg skeleton-shimmer" />
                </div>

                {/* 主卡占位：跟真实 /todo/[id] 的 rounded-2xl bg-elevated/80 对齐，无 border */}
                <div className="p-4 sm:p-8">
                    <div className="overflow-hidden rounded-2xl bg-elevated/80 shadow-sm backdrop-blur-xl">
                        <div className="p-6 sm:p-10 space-y-6">
                            <div className="h-7 w-2/3 rounded skeleton-shimmer" />
                            <div className="space-y-2">
                                <div className="h-4 w-full rounded skeleton-shimmer opacity-70" />
                                <div className="h-4 w-4/5 rounded skeleton-shimmer opacity-60" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="h-12 rounded-xl skeleton-shimmer opacity-50" />
                                <div className="h-12 rounded-xl skeleton-shimmer opacity-50" />
                            </div>
                            <div className="h-32 rounded-xl skeleton-shimmer opacity-40" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
