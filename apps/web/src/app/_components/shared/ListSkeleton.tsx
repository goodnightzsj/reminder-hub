type ListSkeletonProps = {
    rows?: number;
    /** 是否显示左侧 3px accent bar 占位（匹配 TodoItem 视觉） */
    withAccent?: boolean;
};

/**
 * 列表类骨架：对齐 TodoItem / AnniversaryList 等用"分隔线 + 行"节奏的页面，
 * 避免骨架→真实内容跳变导致 CLS。
 */
export function ListSkeleton({ rows = 6, withAccent = false }: ListSkeletonProps) {
    return (
        <ul className="flex flex-col px-2 pb-4 pt-1 sm:px-4">
            {Array.from({ length: rows }).map((_, i) => (
                <li
                    key={i}
                    className="relative flex items-center gap-3 border-b border-divider/50 py-3.5 px-1 last:border-b-0"
                >
                    {withAccent && (
                        <div className="absolute inset-y-0 left-0 w-[3px] bg-muted/30" />
                    )}
                    <div className="h-5 w-5 shrink-0 rounded-[6px] skeleton-shimmer" />
                    <div className="flex-1 space-y-1.5">
                        <div
                            className="h-4 rounded skeleton-shimmer"
                            style={{ width: `${55 + ((i * 7) % 35)}%` }}
                        />
                        <div
                            className="h-3 rounded skeleton-shimmer opacity-70"
                            style={{ width: `${25 + ((i * 11) % 20)}%` }}
                        />
                    </div>
                    <div className="h-6 w-10 shrink-0 rounded-full skeleton-shimmer opacity-60" />
                </li>
            ))}
        </ul>
    );
}

type CardGridSkeletonProps = {
    count?: number;
    /** 卡片近似高度（px），保持和真实卡一致避免 CLS */
    height?: number;
};

/** 网格类骨架：纪念日、订阅、物品页等卡片网格场景使用 */
export function CardGridSkeleton({ count = 6, height = 180 }: CardGridSkeletonProps) {
    return (
        <div className="grid gap-4 px-4 pb-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl border border-default bg-elevated p-5 shadow-sm"
                    style={{ height, animationDelay: `${i * 80}ms` }}
                >
                    <div className="mb-3 flex gap-2">
                        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                        <div className="h-5 w-12 rounded-full skeleton-shimmer opacity-60" />
                    </div>
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="h-12 w-20 rounded-lg skeleton-shimmer" />
                    </div>
                    <div className="mt-auto flex flex-col items-center gap-1.5">
                        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                        <div className="h-3 w-1/2 rounded skeleton-shimmer opacity-70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** 页面头骨架：AppHeader 对齐 */
export function PageHeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
    return (
        <div className="mb-6 space-y-2">
            <div className="h-8 w-40 rounded-lg skeleton-shimmer" />
            {withSubtitle && <div className="h-4 w-56 rounded skeleton-shimmer opacity-70" />}
        </div>
    );
}
