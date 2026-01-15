"use client";

import { ModernCalendar } from "./ui/ModernCalendar";
import { Portal } from "./Portal";

type SmartDateCalendarPopoverProps = {
  open: boolean;
  position: { top: number; left: number };
  direction: "up" | "down";
  value?: Date;
  showTime: boolean;
  showLunar: boolean;
  onChange: (date: Date | undefined) => void;
  onClose: () => void;
};

export function SmartDateCalendarPopover({
  open,
  position,
  direction,
  value,
  showTime,
  showLunar,
  onChange,
  onClose,
}: SmartDateCalendarPopoverProps) {
  if (!open) return null;

  return (
    <Portal>
      <>
        <div
          className="fixed inset-0 z-[9998]"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
        <div
          className="fixed z-[9999] animate-zoom-in"
          style={{
            top: position.top,
            left: position.left,
            transformOrigin: direction === "up" ? "bottom right" : "top right",
          }}
        >
          <ModernCalendar
            value={value}
            showTime={showTime}
            showLunar={showLunar}
            onChange={onChange}
          />
        </div>
      </>
    </Portal>
  );
}
