"use client";

import { useRef, useEffect } from "react";

type TimePickerProps = {
    value?: Date | string; // Date object or "HH:mm" string
    onChange: (date: Date) => void;
    format?: "12" | "24";
    className?: string;
};

export function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // Normalize value to Date
    const dateValue = value instanceof Date ? value : (() => {
        const d = new Date();
        d.setSeconds(0);
        d.setMilliseconds(0);
        if (typeof value === "string" && value.includes(":")) {
            const [h, m] = value.split(":");
            d.setHours(parseInt(h));
            d.setMinutes(parseInt(m));
        }
        return d;
    })();

    const currentHour = dateValue.getHours();
    const currentMinute = dateValue.getMinutes();

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current value on mount
    useEffect(() => {
        if (hourRef.current) {
            const el = hourRef.current.querySelector(`[data-value="${currentHour}"]`) as HTMLElement;
            if (el) {
                hourRef.current.scrollTop = el.offsetTop - hourRef.current.offsetHeight / 2 + el.offsetHeight / 2;
            }
        }
        if (minuteRef.current) {
            const el = minuteRef.current.querySelector(`[data-value="${currentMinute}"]`) as HTMLElement;
            if (el) {
                minuteRef.current.scrollTop = el.offsetTop - minuteRef.current.offsetHeight / 2 + el.offsetHeight / 2;
            }
        }
    }, [currentHour, currentMinute]); // Dependency on values ensures it snaps when external value changes too, but might conflict with manual scroll. 
    // Actually, we probably only want to snap on mount or when popover opens. 
    // For now, let's keep it simple.

    const updateTime = (type: "h" | "m", val: number) => {
        const newDate = new Date(dateValue);
        if (type === "h") newDate.setHours(val);
        else newDate.setMinutes(val);
        onChange(newDate);
    };

    return (
        <div className={`flex gap-2 h-[240px] ${className}`}>
            {/* Hours Column */}
            <div className="flex-1 flex flex-col">
                <div className="text-center text-xs font-bold text-muted uppercase tracking-widest py-2 mb-1">
                    小时
                </div>
                <div className="relative flex-1 h-full overflow-hidden rounded-xl bg-white/5 border border-white/5">
                    {/* Scrollable List */}
                    <div
                        ref={hourRef}
                        className="absolute inset-0 overflow-y-auto hide-scrollbar snap-y snap-mandatory z-10"
                    >
                        <div className="py-[calc(50%-20px)]">
                            <div className="h-[calc(50%-20px)]" />
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    data-value={h}
                                    onClick={() => updateTime("h", h)}
                                    className={`w-full h-10 flex items-center justify-center snap-center transition-all duration-200 ${currentHour === h
                                            ? "text-brand-primary font-bold text-2xl scale-125"
                                            : "text-muted hover:text-primary scale-100"
                                        }`}
                                >
                                    {String(h).padStart(2, "0")}
                                </button>
                            ))}
                            <div className="h-[calc(50%-20px)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center text-muted font-bold pb-8">:</div>

            {/* Minutes Column */}
            <div className="flex-1 flex flex-col">
                <div className="text-center text-xs font-bold text-muted uppercase tracking-widest py-2 mb-1">
                    分钟
                </div>
                <div className="relative flex-1 h-full overflow-hidden rounded-xl bg-white/5 border border-white/5">
                    {/* Scrollable List */}
                    <div
                        ref={minuteRef}
                        className="absolute inset-0 overflow-y-auto hide-scrollbar snap-y snap-mandatory z-10"
                    >
                        <div className="h-[calc(50%-20px)]" />
                        {minutes.map((m) => (
                            <button
                                key={m}
                                data-value={m}
                                onClick={() => updateTime("m", m)}
                                className={`w-full h-10 flex items-center justify-center snap-center transition-all duration-200 ${currentMinute === m
                                        ? "text-brand-primary font-bold text-2xl scale-125"
                                        : "text-muted hover:text-primary scale-100"
                                    }`}
                            >
                                {String(m).padStart(2, "0")}
                            </button>
                        ))}
                        <div className="h-[calc(50%-20px)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
