"use client";

import type { KeyboardEvent, RefObject } from "react";

import type { SmartDateParts } from "./SmartDateInput.utils";

type SmartDatePartInputProps = {
    inputRef: RefObject<HTMLInputElement | null>;
    part: keyof SmartDateParts;
    value: string;
    placeholder: string;
    maxLen: number;
    className: string;
    nextRef?: RefObject<HTMLInputElement | null>;
    prevRef?: RefObject<HTMLInputElement | null>;
    onChangePart: (
        part: keyof SmartDateParts,
        maxLen: number,
        value: string,
        nextRef?: RefObject<HTMLInputElement | null>,
    ) => void;
    onKeyDownPart: (
        e: KeyboardEvent<HTMLInputElement>,
        part: keyof SmartDateParts,
        prevRef?: RefObject<HTMLInputElement | null>,
    ) => void;
};

export function SmartDatePartInput({
    inputRef,
    part,
    value,
    placeholder,
    maxLen,
    className,
    nextRef,
    prevRef,
    onChangePart,
    onKeyDownPart,
}: SmartDatePartInputProps) {
    return (
        <input
            ref={inputRef}
            className={className}
            placeholder={placeholder}
            maxLength={maxLen}
            value={value}
            onChange={(e) => onChangePart(part, maxLen, e.target.value, nextRef)}
            onKeyDown={(e) => onKeyDownPart(e, part, prevRef)}
            onClick={(e) => e.stopPropagation()}
            inputMode="numeric"
        />
    );
}

