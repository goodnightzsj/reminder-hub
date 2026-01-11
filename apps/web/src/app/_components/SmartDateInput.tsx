"use client";

import { useRef, useState, useEffect, KeyboardEvent, ChangeEvent, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ModernCalendar } from "./ui/ModernCalendar";
import { solarToLunar } from "@/lib/lunar-utils";

type SmartDateInputProps = {
    name: string;
    type?: "date" | "datetime-local";
    dateType?: "solar" | "lunar";
    defaultValue?: string;
    required?: boolean;
    className?: string; // Applied to container
};

export function SmartDateInput({
    name,
    type = "date",
    dateType = "solar",
    defaultValue,
    required,
    className = "",
}: SmartDateInputProps) {
    // Parse default value (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
    const parseValue = (val: string | undefined) => {
        if (!val) return { y: "", m: "", d: "", h: "", min: "" };
        const datePart = val.split("T")[0];
        const timePart = val.split("T")[1] || "";
        const [y, m, d] = datePart.split("-");
        const [h, min] = timePart.split(":");
        return {
            y: y || "",
            m: m || "",
            d: d || "",
            h: h || "",
            min: min || "",
        };
    };

    const [parts, setParts] = useState(parseValue(defaultValue));
    const [showCalendar, setShowCalendar] = useState(false);

    // Use a visually hidden native input to handle the actual form submission AND the native picker
    const nativeInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [popoverDirection, setPopoverDirection] = useState<"up" | "down">("down");
    const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // Refs for inputs to manage focus
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const minRef = useRef<HTMLInputElement>(null);

    const isDateTime = type === "datetime-local";
    const isLunar = dateType === "lunar";

    // 农历日期信息（仅当选择了有效日期时计算）
    const lunarInfo = useMemo(() => {
        if (!isLunar || !parts.y || !parts.m || !parts.d) return null;
        const year = parseInt(parts.y);
        const month = parseInt(parts.m);
        const day = parseInt(parts.d);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return solarToLunar(year, month, day);
    }, [isLunar, parts.y, parts.m, parts.d]);

    // Reconstruct string value from parts
    const constructValue = useCallback((p: typeof parts) => {
        const { y, m, d, h, min } = p;
        if (!y || !m || !d) return "";

        const formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

        if (isDateTime) {
            const formattedTime = `${(h || "00").padStart(2, "0")}:${(min || "00").padStart(2, "0")}`;
            return `${formattedDate}T${formattedTime}`;
        }
        return formattedDate;
    }, [isDateTime]);

    // Update native input value whenever parts change
    useEffect(() => {
        if (!nativeInputRef.current) return;
        const newVal = constructValue(parts);
        if (nativeInputRef.current.value !== newVal) {
            nativeInputRef.current.value = newVal;
        }
    }, [parts, constructValue]);

    // Handle selection from the native picker
    const handleNativeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setParts(parseValue(e.target.value));
    };

    const showPicker = () => {
        try {
            nativeInputRef.current?.showPicker();
        } catch (err) {
            // Fallback for older browsers or if showPicker not supported
            console.warn("Browser does not support showPicker or blocked it", err);
            nativeInputRef.current?.click();
        }
    };

    const handleChange = (part: keyof typeof parts, maxLen: number, value: string, nextRef?: React.RefObject<HTMLInputElement | null>) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        setParts(prev => ({ ...prev, [part]: value }));

        if (value.length === maxLen && nextRef) {
            nextRef.current?.focus();
        }
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
        part: keyof typeof parts,
        prevRef?: React.RefObject<HTMLInputElement | null>
    ) => {
        if (e.key === "Backspace" && parts[part] === "" && prevRef) {
            prevRef.current?.focus();
        }
    };

    const toggleCalendar = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showCalendar) {
            // Position calendar around the mouse cursor
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const calendarWidth = 320;
            const calendarHeight = 420;

            // Calculate position to center horizontally around mouse, with bounds checking
            let left = mouseX - calendarWidth / 2;
            left = Math.max(8, Math.min(left, window.innerWidth - calendarWidth - 8));

            // Calculate vertical position - prefer below mouse, flip if not enough space
            const spaceBelow = window.innerHeight - mouseY;
            let top: number;
            let direction: "up" | "down";

            if (spaceBelow < calendarHeight + 20 && mouseY > calendarHeight + 20) {
                direction = "up";
                top = mouseY - calendarHeight - 10;
            } else {
                direction = "down";
                top = mouseY + 10;
            }

            setPopoverDirection(direction);
            setCalendarPosition({ top, left });
        }
        setShowCalendar(!showCalendar);
    };

    const inputBaseClass = "bg-transparent text-center outline-none placeholder:text-muted/30 focus:bg-brand-primary/10 rounded px-0.5 transition-colors";

    return (
        <div
            ref={containerRef}
            className={`flex items-center gap-1 rounded-lg border border-default bg-surface px-3 py-2 text-base text-primary focus-within:ring-2 focus-within:ring-brand-primary/20 md:text-sm cursor-pointer group/container ${className}`}
            onClick={toggleCalendar}
        >
            {/* Visually hidden but functional native input */}
            <input
                ref={nativeInputRef}
                type={type}
                name={name}
                required={required}
                className="pointer-events-none absolute opacity-0 w-0 h-0"
                tabIndex={-1}
                onChange={handleNativeChange}
            />

            {/* 农历模式下提交农历日期信息 */}
            {isLunar && lunarInfo && (
                <>
                    <input type="hidden" name="lunarMonth" value={lunarInfo.month} />
                    <input type="hidden" name="lunarDay" value={lunarInfo.day} />
                    <input type="hidden" name="isLeapMonth" value={lunarInfo.isLeap ? "1" : "0"} />
                </>
            )}

            {/* Year */}
            <input
                ref={yearRef}
                className={`${inputBaseClass} w-12`}
                placeholder="YYYY"
                maxLength={4}
                value={parts.y}
                onChange={(e) => handleChange("y", 4, e.target.value, monthRef)}
                onKeyDown={(e) => handleKeyDown(e, "y")}
                onClick={(e) => e.stopPropagation()}
                inputMode="numeric"
            />
            <span className="text-muted">-</span>

            {/* Month */}
            <input
                ref={monthRef}
                className={`${inputBaseClass} w-8`}
                placeholder="MM"
                maxLength={2}
                value={parts.m}
                onChange={(e) => handleChange("m", 2, e.target.value, dayRef)}
                onKeyDown={(e) => handleKeyDown(e, "m", yearRef)}
                onClick={(e) => e.stopPropagation()}
                inputMode="numeric"
            />
            <span className="text-muted">-</span>

            {/* Day */}
            <input
                ref={dayRef}
                className={`${inputBaseClass} w-8`}
                placeholder="DD"
                maxLength={2}
                value={parts.d}
                onChange={(e) => handleChange("d", 2, e.target.value, isDateTime ? hourRef : undefined)}
                onKeyDown={(e) => handleKeyDown(e, "d", monthRef)}
                onClick={(e) => e.stopPropagation()}
                inputMode="numeric"
            />

            {isDateTime && (
                <>
                    <span className="mx-1 text-muted"> </span>
                    {/* Hour */}
                    <input
                        ref={hourRef}
                        className={`${inputBaseClass} w-8`}
                        placeholder="HH"
                        maxLength={2}
                        value={parts.h}
                        onChange={(e) => handleChange("h", 2, e.target.value, minRef)}
                        onKeyDown={(e) => handleKeyDown(e, "h", dayRef)}
                        onClick={(e) => e.stopPropagation()}
                        inputMode="numeric"
                    />
                    <span className="text-muted">:</span>
                    {/* Minute */}
                    <input
                        ref={minRef}
                        className={`${inputBaseClass} w-8`}
                        placeholder="mm"
                        maxLength={2}
                        value={parts.min}
                        onChange={(e) => handleChange("min", 2, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "min", hourRef)}
                        onClick={(e) => e.stopPropagation()}
                        inputMode="numeric"
                    />
                </>
            )}

            {/* Calendar Icon Trigger */}
            <div className="relative ml-auto">
                <button
                    type="button"
                    onClick={toggleCalendar}
                    className="text-muted hover:text-primary focus:outline-none transition-colors p-1 rounded-md hover:bg-white/5"
                    tabIndex={-1}
                    title="选择日期"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                </button>

                {/* Modern Calendar Popover */}
                {showCalendar && createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[9998]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCalendar(false);
                            }}
                        />
                        <div
                            className="fixed z-[9999] animate-zoom-in"
                            style={{
                                top: calendarPosition.top,
                                left: calendarPosition.left,
                                transformOrigin: popoverDirection === 'up' ? 'bottom right' : 'top right'
                            }}
                        >
                            <ModernCalendar
                                value={
                                    parts.y && parts.m && parts.d
                                        ? (() => {
                                            const d = new Date(parseInt(parts.y), parseInt(parts.m) - 1, parseInt(parts.d));
                                            if (type === "datetime-local") {
                                                d.setHours(parseInt(parts.h || "0"));
                                                d.setMinutes(parseInt(parts.min || "0"));
                                            }
                                            return d;
                                        })()
                                        : undefined
                                }
                                showTime={type === "datetime-local"}
                                showLunar={isLunar}
                                onChange={(date) => {
                                    if (!date) {
                                        setParts({ y: "", m: "", d: "", h: "", min: "" });
                                    } else {
                                        const y = date.getFullYear().toString();
                                        const m = (date.getMonth() + 1).toString();
                                        const d = date.getDate().toString();
                                        const h = date.getHours().toString().padStart(2, '0');
                                        const min = date.getMinutes().toString().padStart(2, '0');
                                        setParts(prev => ({ ...prev, y, m, d, h: type === "datetime-local" ? h : "", min: type === "datetime-local" ? min : "" }));
                                    }
                                    // Don't auto-close - user clicks outside to close
                                }}
                            />
                        </div>
                    </>,
                    document.body
                )}
            </div>
        </div>
    );
}
