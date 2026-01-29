"use client";

import { SmartDateCalendarPopover } from "./SmartDateCalendarPopover";
import { SmartDatePartInput } from "./SmartDatePartInput";
import { DEFAULT_ANNIVERSARY_DATE_TYPE, type AnniversaryDateType } from "@/lib/anniversary";
import { useSmartDateInput } from "./hooks/useSmartDateInput";

type SmartDateInputProps = {
    name: string;
    type?: "date" | "datetime-local";
    dateType?: AnniversaryDateType;
    defaultValue?: string;
    required?: boolean;
    className?: string; // 作用于外层容器
};

export function SmartDateInput({
    name,
    type = "date",
    dateType = DEFAULT_ANNIVERSARY_DATE_TYPE,
    defaultValue,
    required,
    className = "",
}: SmartDateInputProps) {
    const {
        parts,
        isDateTime,
        isLunar,
        lunarInfo,
        showCalendar,
        toggleCalendar,
        closeCalendar,
        popoverDirection,
        calendarPosition,
        calendarValue,
        handleCalendarChange,
        nativeInputRef,
        handleNativeChange,
        yearRef,
        monthRef,
        dayRef,
        hourRef,
        minRef,
        handleChange,
        handleKeyDown,
    } = useSmartDateInput({
        type,
        dateType,
        defaultValue,
    });

    const inputBaseClass = "bg-transparent text-center outline-none placeholder:text-muted/30 focus:bg-brand-primary/10 rounded px-0.5 transition-colors";

    return (
        <div
            className={`flex items-center gap-1 rounded-lg border border-default bg-surface px-3 py-2 text-base text-primary focus-within:ring-2 focus-within:ring-brand-primary/20 md:text-sm cursor-pointer group/container ${className}`}
            onClick={toggleCalendar}
        >
            {/* 不可见但可用的原生 input（用于表单提交） */}
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

            {/* 年 */}
            <SmartDatePartInput
                inputRef={yearRef}
                part="y"
                value={parts.y}
                placeholder="YYYY"
                maxLen={4}
                className={`${inputBaseClass} w-12`}
                nextRef={monthRef}
                onChangePart={handleChange}
                onKeyDownPart={handleKeyDown}
            />
            <span className="text-muted">-</span>

            {/* 月 */}
            <SmartDatePartInput
                inputRef={monthRef}
                part="m"
                value={parts.m}
                placeholder="MM"
                maxLen={2}
                className={`${inputBaseClass} w-8`}
                nextRef={dayRef}
                prevRef={yearRef}
                onChangePart={handleChange}
                onKeyDownPart={handleKeyDown}
            />
            <span className="text-muted">-</span>

            {/* 日 */}
            <SmartDatePartInput
                inputRef={dayRef}
                part="d"
                value={parts.d}
                placeholder="DD"
                maxLen={2}
                className={`${inputBaseClass} w-8`}
                nextRef={isDateTime ? hourRef : undefined}
                prevRef={monthRef}
                onChangePart={handleChange}
                onKeyDownPart={handleKeyDown}
            />

            {isDateTime && (
                <>
                    <span className="mx-1 text-muted"> </span>
                    {/* 时 */}
                    <SmartDatePartInput
                        inputRef={hourRef}
                        part="h"
                        value={parts.h}
                        placeholder="HH"
                        maxLen={2}
                        className={`${inputBaseClass} w-8`}
                        nextRef={minRef}
                        prevRef={dayRef}
                        onChangePart={handleChange}
                        onKeyDownPart={handleKeyDown}
                    />
                    <span className="text-muted">:</span>
                    {/* 分 */}
                    <SmartDatePartInput
                        inputRef={minRef}
                        part="min"
                        value={parts.min}
                        placeholder="mm"
                        maxLen={2}
                        className={`${inputBaseClass} w-8`}
                        prevRef={hourRef}
                        onChangePart={handleChange}
                        onKeyDownPart={handleKeyDown}
                    />
                </>
            )}

            {/* 日历按钮 */}
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

                <SmartDateCalendarPopover
                    open={showCalendar}
                    position={calendarPosition}
                    direction={popoverDirection}
                    value={calendarValue}
                    showTime={type === "datetime-local"}
                    showLunar={isLunar}
                    onChange={handleCalendarChange}
                    onClose={closeCalendar}
                />
            </div>
        </div>
    );
}
