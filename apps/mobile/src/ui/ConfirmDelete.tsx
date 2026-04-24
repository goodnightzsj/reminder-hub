import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

/**
 * Mobile two-stage delete button. First tap arms it (red bg + check),
 * second tap confirms; 3s timeout cancels. Uses mobile-sized touch target.
 */
export function ConfirmDeleteButton({
  onConfirm,
  className = "",
  label = "删除",
}: {
  onConfirm: () => void;
  className?: string;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => cleanup, []);

  const handle = () => {
    if (!armed) {
      setArmed(true);
      timerRef.current = window.setTimeout(() => setArmed(false), 3000);
    } else {
      cleanup();
      setArmed(false);
      onConfirm();
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={armed ? "再次点击确认删除" : label}
      className={`tap-scale h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
        armed
          ? "bg-danger text-white"
          : "text-muted-foreground active:bg-danger/10 active:text-danger"
      } ${className}`}
    >
      <Icon icon={armed ? "ri:check-double-line" : "ri:close-line"} className="h-4 w-4" />
    </button>
  );
}
