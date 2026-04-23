"use client";

import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect, ChangeEvent } from "react";
import { Input } from "./ui/Input";
import { IconCheck, IconChevronDown } from "./Icons";
import { m as motion, AnimatePresence } from "framer-motion";
import { Portal } from "./ui/Portal";

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
    allowCustom?: boolean;
};

const DROPDOWN_MAX_H = 240; // max-h-60 = 15rem
const GAP = 4;

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
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 0 });
    const [direction, setDirection] = useState<"down" | "up">("down");

    const updatePosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < DROPDOWN_MAX_H && rect.top > spaceBelow;
        setDirection(openUp ? "up" : "down");
        setPos(
            openUp
                ? { bottom: window.innerHeight - rect.top + GAP, left: rect.left, width: rect.width }
                : { top: rect.bottom + GAP, left: rect.left, width: rect.width },
        );
    }, []);

    useLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleScroll = (e: Event) => {
            if (dropdownRef.current?.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        const handleResize = () => setIsOpen(false);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(target))
            ) {
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

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    const displayValue = useMemo(() => {
        if (allowCustom) return value;
        const selectedOpt = options.find((o) => o.value === value);
        return selectedOpt ? selectedOpt.label : value;
    }, [allowCustom, value, options]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {!allowCustom && name && <input type="hidden" name={name} value={value} />}

            <div className="relative group">
                <Input
                    ref={inputRef}
                    name={allowCustom ? name : undefined}
                    value={displayValue}
                    onChange={(e) => {
                        if (allowCustom) handleInputChange(e);
                    }}
                    onFocus={() => {
                        if (allowCustom) setIsOpen(true);
                    }}
                    onClick={() => {
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
                        <IconChevronDown className="w-4 h-4" />
                    </div>
                )}
            </div>

            <Portal>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: direction === "up" ? 6 : -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: direction === "up" ? 6 : -6, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, transformOrigin: direction === "up" ? "bottom left" : "top left" }}
                            className="z-[9990] max-h-60 overflow-y-auto rounded-xl border border-black/5 bg-[#F5F5F7]/95 backdrop-blur-xl shadow-2xl p-1 dark:bg-[#1E1E1E]/95 dark:border-white/10"
                        >
                            {options.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`
                                            w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors
                                            ${isSelected ? "text-primary font-medium" : "text-primary"}
                                            hover:bg-brand-primary hover:text-white
                                            group
                                        `}
                                    >
                                        <span className={`w-4 flex items-center justify-center ${isSelected ? "opacity-100" : "opacity-0 group-hover:text-white"}`}>
                                            {isSelected && <IconCheck className="w-3.5 h-3.5" />}
                                        </span>
                                        <span className="flex-1 text-left truncate">{opt.label}</span>
                                    </button>
                                );
                            })}
                            {allowCustom && value && !options.some((opt) => opt.value === value) && (
                                <div className="px-3 py-2 text-xs text-muted border-t border-black/5 dark:border-white/5 mt-1">
                                    使用自定义值：&quot;{value}&quot;
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}
