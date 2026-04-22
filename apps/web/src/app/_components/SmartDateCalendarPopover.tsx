"use client";

import dynamic from "next/dynamic";
import { Portal } from "./ui/Portal";

// ModernCalendar 带 lunar-javascript (~300KB gzipped)，只在用户打开日期选择器时才需要。
// next/dynamic + ssr:false 让它在点击触发前完全不进首屏 bundle。
const ModernCalendar = dynamic(
    () => import("./ui/ModernCalendar").then((m) => ({ default: m.ModernCalendar })),
    {
        ssr: false,
        loading: () => (
            <div className="w-[320px] h-[360px] rounded-2xl bg-base/95 border border-default shadow-lg backdrop-blur-xl animate-pulse" />
        ),
    }
);

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
