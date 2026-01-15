"use client";

import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { solarToLunar } from "@/lib/lunar-utils";
import { ANNIVERSARY_DATE_TYPE, type AnniversaryDateType } from "@/lib/anniversary";

import {
    computeSmartDateCalendarPopoverPosition,
    constructSmartDateInputValue,
    createEmptySmartDateParts,
    parseSmartDateInputValue,
    toDateFromSmartDateParts,
    toSmartDatePartsFromDate,
    type SmartDateCalendarPopoverDirection,
    type SmartDateCalendarPosition,
    type SmartDateParts,
} from "./SmartDateInput.utils";

type UseSmartDateInputOptions = {
    type: "date" | "datetime-local";
    dateType: AnniversaryDateType;
    defaultValue?: string;
};

export function useSmartDateInput({ type, dateType, defaultValue }: UseSmartDateInputOptions) {
    const [parts, setParts] = useState<SmartDateParts>(() => parseSmartDateInputValue(defaultValue));
    const [showCalendar, setShowCalendar] = useState(false);

    const nativeInputRef = useRef<HTMLInputElement>(null);
    const [popoverDirection, setPopoverDirection] = useState<SmartDateCalendarPopoverDirection>("down");
    const [calendarPosition, setCalendarPosition] = useState<SmartDateCalendarPosition>({ top: 0, left: 0 });

    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const minRef = useRef<HTMLInputElement>(null);

    const isDateTime = type === "datetime-local";
    const isLunar = dateType === ANNIVERSARY_DATE_TYPE.LUNAR;

    const lunarInfo = useMemo(() => {
        if (!isLunar || !parts.y || !parts.m || !parts.d) return null;
        const year = parseInt(parts.y);
        const month = parseInt(parts.m);
        const day = parseInt(parts.d);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return solarToLunar(year, month, day);
    }, [isLunar, parts.y, parts.m, parts.d]);

    useEffect(() => {
        if (!nativeInputRef.current) return;
        const newVal = constructSmartDateInputValue(parts, isDateTime);
        if (nativeInputRef.current.value !== newVal) {
            nativeInputRef.current.value = newVal;
        }
    }, [parts, isDateTime]);

    const handleNativeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setParts(parseSmartDateInputValue(e.target.value));
    }, []);

    const handleChange = useCallback((
        part: keyof SmartDateParts,
        maxLen: number,
        value: string,
        nextRef?: RefObject<HTMLInputElement | null>,
    ) => {
        if (!/^\d*$/.test(value)) return;

        setParts(prev => ({ ...prev, [part]: value }));

        if (value.length === maxLen && nextRef) {
            nextRef.current?.focus();
        }
    }, []);

    const handleKeyDown = useCallback((
        e: KeyboardEvent<HTMLInputElement>,
        part: keyof SmartDateParts,
        prevRef?: RefObject<HTMLInputElement | null>,
    ) => {
        if (e.key === "Backspace" && parts[part] === "" && prevRef) {
            prevRef.current?.focus();
        }
    }, [parts]);

    const toggleCalendar = useCallback((e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        if (!showCalendar) {
            const { direction, position } = computeSmartDateCalendarPopoverPosition(e.clientX, e.clientY);
            setPopoverDirection(direction);
            setCalendarPosition(position);
        }
        setShowCalendar(!showCalendar);
    }, [showCalendar]);

    const closeCalendar = useCallback(() => setShowCalendar(false), []);

    const calendarValue = useMemo(() => toDateFromSmartDateParts(parts, type), [parts, type]);

    const handleCalendarChange = useCallback((date: Date | undefined) => {
        if (!date) {
            setParts(createEmptySmartDateParts());
        } else {
            setParts(toSmartDatePartsFromDate(date, type));
        }
    }, [type]);

    return {
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
    };
}
