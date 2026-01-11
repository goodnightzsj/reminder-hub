"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "../Icons";

type ModernCalendarProps = {
    value?: Date;
    onChange: (date: Date) => void;
    showTime?: boolean;
    className?: string;
};

const DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function ModernCalendar({ value, onChange, showTime = false, className = "" }: ModernCalendarProps) {
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

    const handleTimeChange = (type: "h" | "m", val: number) => {
        const current = value || new Date();
        const newDate = new Date(current);
        if (type === "h") newDate.setHours(val);
        else newDate.setMinutes(val);
        onChange(newDate);
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

    const isToday = (d: number) => {
        const now = new Date();
        return now.getDate() === d && now.getMonth() === month && now.getFullYear() === year;
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

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
                        <Icons.Calendar className="w-3.5 h-3.5" />
                        日期
                    </button>
                    <button
                        onClick={() => setActiveTab("time")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === "time" ? "bg-white/10 text-primary" : "text-muted hover:text-primary"}`}
                    >
                        <Icons.Clock className="w-3.5 h-3.5" />
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
                                    <Icons.ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="text-lg font-bold bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent">
                                    {year}年 {String(month + 1).padStart(2, '0')}月
                                </div>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors active:scale-95"
                                >
                                    <Icons.ChevronRight className="w-5 h-5" />
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
                            <div className="relative h-[240px]">
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
                                                            relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300
                                                            ${selected
                                                                ? "bg-gradient-to-br from-brand-primary to-blue-600 text-white shadow-lg shadow-brand-primary/40 scale-105"
                                                                : "hover:bg-white/10 text-primary hover:scale-110"
                                                            }
                                                            ${today && !selected ? "ring-2 ring-brand-primary/50 text-brand-primary font-bold" : ""}
                                                        `}
                                                    >
                                                        {day}
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
                            className="flex flex-col gap-6 py-4"
                        >
                            <div className="grid grid-cols-2 gap-8 h-[240px]">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-center text-xs font-bold text-muted uppercase tracking-widest">小时</label>
                                    <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {hours.map(h => (
                                                <button
                                                    key={h}
                                                    onClick={() => handleTimeChange("h", h)}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${value?.getHours() === h ? "bg-brand-primary text-white shadow-md" : "hover:bg-white/10 text-primary"}`}
                                                >
                                                    {String(h).padStart(2, '0')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-center text-xs font-bold text-muted uppercase tracking-widest">分钟</label>
                                    <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {minutes.map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => handleTimeChange("m", m)}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${Math.floor((value?.getMinutes() || 0) / 5) * 5 === m ? "bg-brand-primary text-white shadow-md" : "hover:bg-white/10 text-primary"}`}
                                                >
                                                    {String(m).padStart(2, '0')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/5 flex justify-between items-center">
                <button
                    onClick={() => { onChange(undefined as any); }}
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
                            设时间 <Icons.ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
