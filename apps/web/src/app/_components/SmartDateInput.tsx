"use client";

import { useRef, useState, useEffect, KeyboardEvent, ChangeEvent, useCallback } from "react";

type SmartDateInputProps = {
    name: string;
    type?: "date" | "datetime-local";
    defaultValue?: string;
    required?: boolean;
    className?: string; // Applied to container
};

export function SmartDateInput({
    name,
    type = "date",
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

    // Use a visually hidden native input to handle the actual form submission AND the native picker
    const nativeInputRef = useRef<HTMLInputElement>(null);

    // Refs for inputs to manage focus
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const minRef = useRef<HTMLInputElement>(null);

    const isDateTime = type === "datetime-local";

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

    const inputBaseClass = "bg-transparent text-center outline-none placeholder:text-muted/30 focus:bg-brand-primary/10 rounded px-0.5 transition-colors";

    return (
        <div className={`flex items-center gap-1 rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary focus-within:ring-2 focus-within:ring-brand-primary/20 ${className}`}>
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

            {/* Year */}
            <input
                ref={yearRef}
                className={`${inputBaseClass} w-12`}
                placeholder="YYYY"
                maxLength={4}
                value={parts.y}
                onChange={(e) => handleChange("y", 4, e.target.value, monthRef)}
                onKeyDown={(e) => handleKeyDown(e, "y")}
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
                        inputMode="numeric"
                    />
                </>
            )}

            {/* Calendar Icon Trigger */}
            <button
                type="button"
                onClick={showPicker}
                className="ml-auto text-muted hover:text-primary focus:outline-none"
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
        </div>
    );
}
