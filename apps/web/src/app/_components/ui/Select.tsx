"use client";

import { Children, isValidElement, type ComponentProps } from "react";
import { CustomSelect } from "../CustomSelect";

type SelectChangeEvent = {
    target: { value: string };
    currentTarget: { value: string };
};

export type SelectProps = Omit<ComponentProps<"select">, "defaultValue" | "onChange" | "value"> & {
    placeholder?: string;
    allowCustom?: boolean;
    value?: string;
    defaultValue?: string;
    onChange?: (event: SelectChangeEvent) => void;
};

export function Select({ children, className, value, defaultValue, onChange, allowCustom, ...props }: SelectProps) {
    // Extract options from children <option> elements
    const options = Children.toArray(children).map((child) => {
        // Handle standard <option value="...">Label</option>
        if (isValidElement(child)) {
            const childProps = child.props as { value?: unknown; children?: unknown };
            // Skip if it's not an option-like element (roughly check value prop or children)
            // We relax the check to allow functional components rendering options if needed
            return {
                value: String(childProps.value ?? ""),
                label: String(childProps.children ?? ""),
            };
        }
        return null;
    }).filter((opt): opt is { value: string; label: string } => opt !== null);

    return (
        <CustomSelect
            options={options}
            allowCustom={allowCustom ?? false} // Default to false (strict select) unless specified
            className={className}
            name={props.name}
            required={props.required}
            defaultValue={defaultValue}
            value={value}
            // Adapter for onChange: CustomSelect emits string, Select expects change-like event
            onChange={(val) => {
                onChange?.({ target: { value: val }, currentTarget: { value: val } });
            }}
            placeholder={props.placeholder || "选择..."}
        />
    );
}
