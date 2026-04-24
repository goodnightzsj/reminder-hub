import { useEffect, useState } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-muted ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
  );
}

export function DeferredSkeleton({
  delayMs = 150,
  children,
}: {
  delayMs?: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);
  if (!visible) return null;
  return <>{children}</>;
}

/** Mobile todo row — card with border matches the real list shape. */
export function TodoListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border"
        >
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-4 flex-1" style={{ maxWidth: `${55 + ((i * 13) % 35)}%` }} />
        </li>
      ))}
    </ul>
  );
}
