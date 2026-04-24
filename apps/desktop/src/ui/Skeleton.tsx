import { useEffect, useState } from "react";

/**
 * Shimmer-style skeleton block. Use for loading placeholders instead of a spinner
 * to avoid content layout shift when data arrives.
 */
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

/**
 * Render `children` only after `delayMs` has passed. Prevents skeleton flash
 * for operations that typically complete in a few frames.
 */
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

/** Preset: rows of todo-list shaped skeletons. */
export function TodoListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-1.5 max-w-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 + ((i * 17) % 30)}%` }} />
        </li>
      ))}
    </ul>
  );
}
