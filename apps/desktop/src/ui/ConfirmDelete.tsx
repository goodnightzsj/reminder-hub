import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

/**
 * Two-stage delete button. First click arms it (turns red with a check icon);
 * a second click within 3s confirms. If no second click, it auto-cancels.
 * This prevents accidental single-click deletion while avoiding a modal.
 */
export function ConfirmDeleteButton({
  onConfirm,
  className = "",
  hoverReveal = true,
  label = "删除",
}: {
  onConfirm: () => void;
  className?: string;
  /** Whether the button should be hover-revealed (desktop list row pattern). */
  hoverReveal?: boolean;
  /** Announced label before arming. */
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

  // Hide-until-hover is a desktop affordance; on touch devices (`hover: none`
  // pointer) the button would stay invisible and users couldn't delete anything
  // — force visibility there so the control is reachable.
  const revealClass = hoverReveal && !armed
    ? "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
    : "";

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={armed ? "再次点击确认删除" : label}
      className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
        armed
          ? "bg-danger text-white shadow-sm"
          : "text-muted-foreground hover:bg-danger/10 hover:text-danger"
      } ${revealClass} ${className}`}
    >
      <Icon icon={armed ? "ri:check-double-line" : "ri:delete-bin-line"} className="h-4 w-4" />
    </button>
  );
}
