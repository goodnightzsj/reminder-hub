"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

type DateView = "days" | "months" | "years";

const DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const YEARS_PER_PAGE = 12;

export function ModernCalendar({ value, onChange, showTime = false, showLunar = false, className = "" }: ModernCalendarProps) {
    const [viewDate, setViewDate] = useState(value || new Date());
    const [direction, setDirection] = useState(0);
    const [activeTab, setActiveTab] = useState<"date" | "time">("date");
    const [view, setView] = useState<DateView>("days");
    const prefersReducedMotion = useReducedMotion();
    const [yearPageStart, setYearPageStart] = useState(() => {
        const y = (value || new Date()).getFullYear();
        return Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    });

    const selectedYearRef = useRef<HTMLButtonElement>(null);

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
    };

    const { days, firstDay, year, month } = getDaysInMonth(viewDate);

    const isToday = (d: number) => {
        const now = new Date();
        return now.getDate() === d && now.getMonth() === month && now.getFullYear() === year;
    };

    const isSelected = (d: number) => {
        if (!value) return false;
        return value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
    };

    const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
    const grid = Array.from({ length: totalSlots }, (_, i) => {
        const dayNum = i - firstDay + 1;
        if (dayNum > 0 && dayNum <= days) return dayNum;
        return null;
    });

    const years = useMemo(
        () => Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i),
        [yearPageStart]
    );

    useEffect(() => {
        if (view === "years" && selectedYearRef.current) {
            selectedYearRef.current.scrollIntoView({ block: "nearest" });
        }
    }, [view]);

    const openMonthView = () => setView("months");
    const openYearView = () => {
        setYearPageStart(Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
        setView("years");
    };
    const backToDays = () => setView("days");

    const handlePickMonth = (m: number) => {
        setDirection(m > month ? 1 : -1);
        setViewDate(new Date(year, m, 1));
        setView("days");
    };
    const handlePickYear = (y: number) => {
        setDirection(y > year ? 1 : -1);
        setViewDate(new Date(y, month, 1));
        setView("months");
    };

    const headerHeight = showLunar ? "h-[280px]" : "h-[240px]";

    return (
        <div
            className={`w-[320px] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {showTime && (
                <div className="flex p-1 bg-white/5 border-b border-white/5">
                    <button
                        type="button"
                        onClick={() => setActiveTab("date")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === "date" ? "bg-white/10 text-primary" : "text-muted hover:text-primary"}`}
                    >
                        <IconCalendar className="w-3.5 h-3.5" />
                        日期
                    </button>
                    <button
                        type="button"
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
                            <div className="flex items-center justify-between mb-4 px-2">
                                <button
                                    type="button"
                                    onClick={
                                        view === "days" ? handlePrevMonth :
                                        view === "months" ? () => handlePickYear(year - 1) :
                                        () => setYearPageStart((s) => s - YEARS_PER_PAGE)
                                    }
                                    className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors active:scale-95"
                                    aria-label="上一页"
                                >
                                    <IconChevronLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-1 text-lg font-bold">
                                    {view === "days" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={openYearView}
                                                className="px-2 py-0.5 rounded-md hover:bg-white/10 bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent transition-colors"
                                            >
                                                {year}年
                                            </button>
                                            <button
                                                type="button"
                                                onClick={openMonthView}
                                                className="px-2 py-0.5 rounded-md hover:bg-white/10 bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent transition-colors"
                                            >
                                                {String(month + 1).padStart(2, "0")}月
                                            </button>
                                        </>
                                    )}
                                    {view === "months" && (
                                        <button
                                            type="button"
                                            onClick={openYearView}
                                            className="px-2 py-0.5 rounded-md hover:bg-white/10 bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent transition-colors"
                                        >
                                            {year}年
                                        </button>
                                    )}
                                    {view === "years" && (
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-primary to-brand-primary bg-clip-text text-transparent">
                                            {years[0]} - {years[years.length - 1]}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        view === "days" ? handleNextMonth :
                                        view === "months" ? () => handlePickYear(year + 1) :
                                        () => setYearPageStart((s) => s + YEARS_PER_PAGE)
                                    }
                                    className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors active:scale-95"
                                    aria-label="下一页"
                                >
                                    <IconChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {view === "days" && (
                                <>
                                    <div className="grid grid-cols-7 mb-2">
                                        {DAYS.map(day => (
                                            <div key={day} className="text-center text-xs font-medium text-muted/60 py-1">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`relative ${headerHeight}`}>
                                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                            <motion.div
                                                key={viewDate.toISOString()}
                                                custom={direction}
                                                initial={prefersReducedMotion ? { opacity: 0 } : { x: direction * 180, opacity: 0 }}
                                                animate={prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
                                                exit={prefersReducedMotion ? { opacity: 0 } : { x: direction * -180, opacity: 0 }}
                                                transition={prefersReducedMotion
                                                    ? { duration: 0.15 }
                                                    : { type: "spring", stiffness: 360, damping: 32 }}
                                                className="grid grid-cols-7 gap-y-2 absolute w-full"
                                            >
                                                {grid.map((day, i) => {
                                                    if (!day) return <div key={i} />;
                                                    const selected = isSelected(day);
                                                    const today = isToday(day);
                                                    return (
                                                        <div key={i} className="flex justify-center">
                                                            <button
                                                                type="button"
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
                                </>
                            )}

                            {view === "months" && (
                                <motion.div
                                    key="months-panel"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                                    className={`grid grid-cols-3 gap-2 ${headerHeight} content-center`}
                                >
                                    {MONTHS.map((label, idx) => {
                                        const selected = idx === month && year === (value?.getFullYear() ?? year);
                                        const isCurrent = idx === month;
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => handlePickMonth(idx)}
                                                className={`
                                                    h-14 rounded-xl text-sm font-medium transition-all duration-200
                                                    ${selected
                                                        ? "bg-gradient-to-br from-brand-primary to-blue-600 text-white shadow-lg shadow-brand-primary/40 scale-[1.03]"
                                                        : isCurrent
                                                            ? "ring-1 ring-brand-primary/40 text-primary hover:bg-white/10 hover:scale-[1.03]"
                                                            : "text-primary hover:bg-white/10 hover:scale-[1.03]"
                                                    }
                                                `}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {view === "years" && (
                                <motion.div
                                    key="years-panel"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                                    className={`grid grid-cols-3 gap-2 ${headerHeight} content-center overflow-y-auto hide-scrollbar`}
                                >
                                    {years.map((y) => {
                                        const selected = y === (value?.getFullYear() ?? year);
                                        const isNow = y === new Date().getFullYear();
                                        return (
                                            <button
                                                key={y}
                                                ref={selected ? selectedYearRef : undefined}
                                                type="button"
                                                onClick={() => handlePickYear(y)}
                                                className={`
                                                    h-14 rounded-xl text-sm font-medium transition-all duration-200
                                                    ${selected
                                                        ? "bg-gradient-to-br from-brand-primary to-blue-600 text-white shadow-lg shadow-brand-primary/40 scale-[1.03]"
                                                        : isNow
                                                            ? "ring-1 ring-brand-primary/40 text-primary hover:bg-white/10 hover:scale-[1.03]"
                                                            : "text-primary hover:bg-white/10 hover:scale-[1.03]"
                                                    }
                                                `}
                                            >
                                                {y}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
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
                    type="button"
                    onClick={() => onChange(undefined)}
                    className="text-xs text-muted hover:text-red-400 transition-colors"
                >
                    清除
                </button>
                <div className="flex gap-3">
                    {view !== "days" && activeTab === "date" && (
                        <button
                            type="button"
                            onClick={backToDays}
                            className="text-xs text-muted hover:text-primary transition-colors"
                        >
                            返回
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            const now = new Date();
                            setViewDate(now);
                            onChange(now);
                            setView("days");
                        }}
                        className="text-xs text-muted hover:text-brand-primary font-medium transition-colors"
                    >
                        今天
                    </button>
                    {showTime && activeTab === "date" && (
                        <button
                            type="button"
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
