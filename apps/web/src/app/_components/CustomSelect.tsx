"use client";

import { useEffect, useState } from "react";
import { Select, SelectProps } from "./Select";
import { Input } from "./Input";

type Option = {
    value: string;
    label: string;
};

type CustomSelectProps = Omit<SelectProps, "onChange"> & {
    options: Option[];
    customValuePrefix?: string; // Optional prefix for custom value internal handling if needed
    placeholder?: string;
};

export function CustomSelect({
    options,
    name,
    defaultValue = "",
    placeholder = "请输入...",
    className,
    ...props
}: CustomSelectProps) {
    const [mode, setMode] = useState<"select" | "custom">(() => {
        // If defaultValue matches an option, use select mode.
        // If defaultValue is present but not in options, use custom mode.
        // If empty, default to select.
        if (!defaultValue) return "select";
        return options.some(opt => opt.value === defaultValue) ? "select" : "custom";
    });

    const [customValue, setCustomValue] = useState(
        mode === "custom" ? (defaultValue as string) : ""
    );

    // Sync mode if defaultValue changes externally (unlikely for uncontrolled form but safer)
    useEffect(() => {
        if (defaultValue && !options.some(opt => opt.value === defaultValue)) {
            const t = setTimeout(() => {
                setMode("custom");
                setCustomValue(defaultValue as string);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [defaultValue, options]);

    return (
        <div className={`space-y-2 ${className}`}>
            <Select
                {...props}
                name={mode === "select" ? name : undefined} // Only submit this if in select mode
                defaultValue={mode === "select" ? defaultValue : "custom"}
                value={mode === "select" ? undefined : "custom"} // Force "custom" value when in custom mode
                onChange={(e) => {
                    if (e.target.value === "custom") {
                        setMode("custom");
                    } else {
                        setMode("select");
                    }
                }}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
                <option value="custom">自定义...</option>
            </Select>

            {mode === "custom" && (
                <div className="animate-fade-in flex items-center gap-2">
                    <Input
                        name={name} // Submit this name when in custom mode
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder={placeholder}
                        required={props.required}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setMode("select")}
                        className="p-2 text-xs text-muted hover:text-primary whitespace-nowrap"
                    >
                        返回选择
                    </button>
                </div>
            )}
        </div>
    );
}
