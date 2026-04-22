import { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

/**
 * 聚焦态设计原则：
 * - 用 ring（box-shadow）而不是 outline，保证和 rounded-lg 一致
 * - 聚焦时边框变 brand 色 + 外圈柔光 ring，不出现直角矩形或"底部线条"
 * - focus-visible 而非 focus，点击不触发 ring，仅键盘/程序聚焦才显示
 */
export function Input({ className = "", ...props }: InputProps) {
    return (
        <input
            className={`h-11 w-full rounded-lg border border-default bg-transparent px-3 text-base text-primary outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus-visible:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
            {...props}
        />
    );
}
