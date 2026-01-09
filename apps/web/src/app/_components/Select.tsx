"use client";

import { Children, isValidElement, ComponentProps } from "react";
import { CustomSelect } from "./CustomSelect";

export type SelectProps = ComponentProps<"select"> & {
    placeholder?: string;
    allowCustom?: boolean;
};

export function Select({ children, className, value, defaultValue, onChange, allowCustom, ...props }: SelectProps) {
    // Extract options from children <option> elements
    const options = Children.toArray(children).map((child) => {
        // Handle standard <option value="...">Label</option>
        if (isValidElement(child)) {
            const childProps = child.props as any;
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
            defaultValue={defaultValue as string}
            value={value as string}
            // Adapter for onChange: CustomSelect emits string, Select expects event
            onChange={(val) => {
                if (onChange) {
                    // Best effort mock event for compatibility
                    onChange({
                        target: { value: val } as HTMLSelectElement,
                        currentTarget: { value: val } as HTMLSelectElement,
                        bubbles: true,
                        cancelable: true,
                        defaultPrevented: false,
                        eventPhase: 3,
                        isTrusted: true,
                        persist: () => { },
                        preventDefault: () => { },
                        isDefaultPrevented: () => false,
                        stopPropagation: () => { },
                        isPropagationStopped: () => false,
                        type: 'change',
                        nativeEvent: new Event('change'),
                        ...({} as any) // Cast to satisfy strict types if needed
                    } as any);
                }
            }}
            placeholder={props.placeholder || "选择..."}
        />
    );
}
