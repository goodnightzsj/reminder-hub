"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from "../Icons";
import { getLunarDayText } from "@/lib/lunar-utils";
import { TimePicker } from "./TimePicker";

type ModernCalendarProps = {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    showTime?: boolean;
    showLunar?: boolean;
    className?: string;
};

const DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function ModernCalendar({ value, onChange, showTime = false, showLunar = false, className = "" }: ModernCalendarProps) {
    const [viewDate, setViewDate] = useState(value || new Date());
    const [direction, setDirection] = useState(0);
    const [activeTab, setActiveTab] = useState<"date" | "time">("date");

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, year, month };
    };

    const handlePrevMonth = () => {
        setDirection(-1);
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDirection(1);
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const current = value || new Date();
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (showTime) {
            newDate.setHours(current.getHours());
            newDate.setMinutes(current.getMinutes());
        } else {
            newDate.setHours(0, 0, 0, 0);
        }
        onChange(newDate);
        if (showTime) {
            // Optional: automatically switch to time tab?
            // setActiveTab("time");
        }
    };

    const isToday = (d: number) => {
        const now = new Date();
        return now.getDate() === d && now.getMonth() === month && now.getFullYear() === year;
    };

    const { days, firstDay, year, month } = getDaysInMonth(viewDate);

    // Generate grid
    const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
    const grid = Array.from({ length: totalSlots }, (_, i) => {
        const dayNum = i - firstDay + 1;
        if (dayNum > 0 && dayNum <= days) return dayNum;
        return null;
    });

    const isSelected = (d: number) => {
        if (!value) return false;
        return value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
    };

    return (
        <div
            className={`w-[320px] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Tab Switcher if showTime */}
            {showTime && (
                <div className="flex p-1 bg-white/5 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab("date")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === "date" ? "bg-white/10 text-primary" : "text-muted hover:text-primary"}`}
                    >
                        <IconCalendar className="w-3.5 h-3.5" />
                        日期
                    </button>
                    <button
                        onClick={() => setActiveTab("time")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === "time" ? "bg-white/10 text-primary" : "text-muted hover:text-primary"}`}
                    >
                        <IconClock className="w-3.5 h-3.5" />
                        时间
                    </button>
                </div>
            )}

            <div className="p-4">
                <AnimatePresence mode="wait">
                    {activeTab === "date" ? (
                        <motion.div
                            key="date-panel"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors active:scale-95"
                                >
                                    <IconChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="text-lg font-bold bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent">
                                    {year}年 {String(month + 1).padStart(2, '0')}月
                                </div>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors active:scale-95"
                                >
                                    <IconChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 mb-2">
                                {DAYS.map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-muted/60 py-1">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className={`relative ${showLunar ? "h-[280px]" : "h-[240px]"}`}>
                                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                    <motion.div
                                        key={viewDate.toISOString()}
                                        custom={direction}
                                        initial={{ x: direction * 300, opacity: 0, scale: 0.9 }}
                                        animate={{ x: 0, opacity: 1, scale: 1 }}
                                        exit={{ x: direction * -300, opacity: 0, scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="grid grid-cols-7 gap-y-2 absolute w-full"
                                    >
                                        {grid.map((day, i) => {
                                            if (!day) return <div key={i} />;

                                            const selected = isSelected(day);
                                            const today = isToday(day);

                                            return (
                                                <div key={i} className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDateClick(day)}
                                                        className={`
                                                            relative rounded-xl flex flex-col items-center justify-center font-medium transition-all duration-300
                                                            ${showLunar ? "w-10 h-12 text-xs" : "w-10 h-10 text-sm"}
                                                            ${selected
                                                                ? "bg-gradient-to-br from-brand-primary to-blue-600 text-white shadow-lg shadow-brand-primary/40 scale-105"
                                                                : "hover:bg-white/10 text-primary hover:scale-110"
                                                            }
                                                            ${today && !selected ? "ring-2 ring-brand-primary/50 text-brand-primary font-bold" : ""}
                                                        `}
                                                    >
                                                        <span>{day}</span>
                                                        {showLunar && (
                                                            <span className={`text-[9px] leading-tight ${selected ? "text-white/70" : "text-muted"}`}>
                                                                {getLunarDayText(year, month + 1, day)}
                                                            </span>
                                                        )}
                                                        {selected && (
                                                            <motion.div
                                                                layoutId="selected-ring"
                                                                className="absolute inset-0 border-2 border-white/20 rounded-xl"
                                                                transition={{ duration: 0.2 }}
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="time-panel"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="p-2"
                        >
                            <TimePicker
                                value={value || new Date()}
                                onChange={onChange}
                                className="h-[240px]"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/5 flex justify-between items-center">
                <button
                    onClick={() => onChange(undefined)}
                    className="text-xs text-muted hover:text-red-400 transition-colors"
                >
                    清除
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const now = new Date();
                            setViewDate(now);
                            onChange(now);
                        }}
                        className="text-xs text-muted hover:text-brand-primary font-medium transition-colors"
                    >
                        今天
                    </button>
                    {showTime && activeTab === "date" && (
                        <button
                            onClick={() => setActiveTab("time")}
                            className="text-xs text-brand-primary font-bold hover:opacity-80 transition-all flex items-center gap-1"
                        >
                            设时间 <IconChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
