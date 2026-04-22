"use client";

import React, { useState, useRef } from "react";
import { m as motion } from "framer-motion";
import { IconCheck, IconClock } from "./Icons";
import { TimePicker } from "./ui/TimePicker";
import { Portal } from "./ui/Portal";

type TimeInputProps = {
    name: string;
    value: string; // "HH:mm"
    onChange: (e: { target: { name: string; value: string } }) => void;
    required?: boolean;
    className?: string;
    disabled?: boolean;
};

export function TimeInput({ name, value, onChange, required, className = "", disabled }: TimeInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const toggleOpen = (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();

        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Default drop down, but could calculate space
            setPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
        setIsOpen(!isOpen);
    };

    const handleTimeChange = (date: Date) => {
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        const newValue = `${h}:${m}`;
        onChange({ target: { name, value: newValue } });
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Native input for form submission (hidden) */}
            <input
                type="hidden"
                name={name}
                value={value}
                required={required}
            />

            {/* Custom Trigger */}
            <div
                onClick={toggleOpen}
                className={`
                    flex items-center gap-2 cursor-pointer 
                    bg-surface border border-default rounded-xl px-3 py-2
                    transition-all duration-200
                    ${isOpen ? "ring-2 ring-brand-primary/20 border-brand-primary" : "hover:bg-white/5"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${className}
                `}
            >
                <IconClock className={`w-4 h-4 ${isOpen ? "text-brand-primary" : "text-muted"}`} />
                <span className={`text-sm font-medium ${!value ? "text-muted" : "text-primary"}`}>
                    {value || "--:--"}
                </span>
            </div>

            {/* Portal for Popover */}
            {isOpen && (
                <Portal>
                    <>
                        <div
                            className="fixed inset-0 z-[9998]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        />
                        <div
                            className="fixed z-[9999]"
                            style={{
                                top: position.top,
                                left: position.left,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 w-[280px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                    <span className="text-xs font-bold text-muted uppercase tracking-wider">选择时间</span>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-white/10 rounded-md text-muted hover:text-primary transition-colors"
                                    >
                                        <IconCheck className="w-4 h-4" />
                                    </button>
                                </div>

                                <TimePicker
                                    value={value}
                                    onChange={handleTimeChange}
                                    className="h-[200px]"
                                />
                            </motion.div>
                        </div>
                    </>
                </Portal>
            )}
        </div>
    );
}
