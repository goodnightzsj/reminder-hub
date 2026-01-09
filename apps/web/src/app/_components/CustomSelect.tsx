"use client";

import { useState, useRef, useEffect, useMemo, ChangeEvent } from "react";
import { Input } from "./Input";
import { Icons } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";

type Option = {
    value: string;
    label: string;
};

type CustomSelectProps = {
    options: Option[];
    name?: string;
    defaultValue?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    allowCustom?: boolean; // New prop: if false, acts as a strict select
};

/**
 * 可输入或仅选择的下拉组件
 * 
 * Modes:
 * 1. allowCustom={true} (默认): 类似 Combobox，允许自由输入。Visible Input 的 Value 即提交 Value。
 * 2. allowCustom={false}: 类似 Select，只读。Visible Input 显示 Label，Hidden Input 提交 Value。
 */
export function CustomSelect({
    options,
    name,
    defaultValue = "",
    placeholder = "选择...",
    className,
    required,
    allowCustom = true,
    value: controlledValue,
    onChange,
}: CustomSelectProps & { value?: string; onChange?: (value: string) => void }) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optValue: string) => {
        if (!isControlled) {
            setInternalValue(optValue);
        }
        onChange?.(optValue);
        setIsOpen(false);
    };

    // Handle input change for allowCustom
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    // Calculate display text
    const displayValue = useMemo(() => {
        if (allowCustom) return value;
        const selectedOpt = options.find((o) => o.value === value);
        return selectedOpt ? selectedOpt.label : value;
    }, [allowCustom, value, options]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Hidden Input for Form Submission in Strict Mode */}
            {!allowCustom && name && <input type="hidden" name={name} value={value} />}

            <div className="relative group">
                <Input
                    ref={inputRef}
                    name={allowCustom ? name : undefined} // Only trigger name if editable
                    value={displayValue}
                    onChange={(e) => {
                        if (allowCustom) handleInputChange(e);
                    }}
                    onFocus={() => {
                        if (allowCustom) setIsOpen(true);
                    }}
                    onClick={() => {
                        // For readonly mode, click should toggle or open
                        if (!allowCustom) setIsOpen(!isOpen);
                        else setIsOpen(true);
                    }}
                    readOnly={!allowCustom}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    className={`${!allowCustom ? "cursor-default caret-transparent selection:bg-transparent" : ""} pr-8`}
                />
                {!allowCustom && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                        <Icons.ChevronDown className="w-4 h-4" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute z-50 mt-1 min-w-full w-max max-h-60 overflow-y-auto rounded-xl border border-black/5 bg-[#F5F5F7]/95 backdrop-blur-xl shadow-2xl p-1 dark:bg-[#1E1E1E]/95 dark:border-white/10"
                    >
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                        w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors
                                        ${isSelected ? "text-primary font-medium" : "text-primary"}
                                        hover:bg-brand-primary hover:text-white
                                        group
                                    `}
                                >
                                    <span className={`w-4 flex items-center justify-center ${isSelected ? "opacity-100" : "opacity-0 group-hover:text-white"}`}>
                                        {isSelected && <Icons.Check className="w-3.5 h-3.5" />}
                                    </span>
                                    <span className="flex-1 text-left truncate">{opt.label}</span>
                                </button>
                            );
                        })}
                        {allowCustom && value && !options.some((opt) => opt.value === value) && (
                            <div className="px-3 py-2 text-xs text-muted border-t border-black/5 dark:border-white/5 mt-1">
                                使用自定义值: "{value}"
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

