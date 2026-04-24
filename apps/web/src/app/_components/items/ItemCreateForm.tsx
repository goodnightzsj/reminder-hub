"use client";

import { useState, useRef } from "react";
import { Input } from "@/app/_components/ui/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { createItem } from "@/app/_actions/items";
import { IconCheck } from "@/app/_components/Icons";
import { useToast } from "@/app/_components/ui/Toast";
import { useTimeouts } from "@/app/_components/hooks/useTimeouts";
import { useCreateModal } from "../hooks/useCreateModal";
import { DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE, runCreateFormSuccess } from "@/app/_components/create-form.utils";
import {
    DEFAULT_ITEM_CATEGORY,
    DEFAULT_ITEM_STATUS,
    itemCategoryOptions,
    itemCurrencyOptions,
    itemStatusOptions,
} from "@/lib/items";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { AdvancedOptions } from "@/app/_components/shared/AdvancedOptions";

type ItemCreateFormProps = {
    className?: string; // Allow overriding styles
};

export function ItemCreateForm({ className = "" }: ItemCreateFormProps) {
    const { closeIfOpen } = useCreateModal();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success, error: toastError } = useToast();
    const { scheduleTimeout } = useTimeouts();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createItem(formData);

            runCreateFormSuccess({
                setIsSuccess,
                toastSuccess: success,
                setFormKey,
                formRef,
                scheduleTimeout,
                closeCreateModalIfOpen: closeIfOpen,
            });
        } catch (error) {
            console.error(error);
            toastError(DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className={`flex flex-col gap-5 ${className}`}>
            <div key={formKey} className="contents">
                {/* 核心字段：名称 + 购入日期 + 价格 + 币种 */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary">物品名称</label>
                    <Input
                        name="name"
                        placeholder="新增物品（如 键盘 / 咖啡机 / 跑鞋）"
                        className="h-12 bg-surface"
                        autoComplete="off"
                        required
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">购入日期</label>
                        <SmartDateInput type="date" name="purchasedDate" className="h-12 bg-base/50" />
                    </div>

                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">价格</label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            name="price"
                            placeholder="0.00"
                            className="h-12 bg-surface"
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">币种</label>
                        <CustomSelect
                            name="currency"
                            defaultValue={DEFAULT_CURRENCY}
                            className="h-12 bg-surface"
                            options={itemCurrencyOptions}
                            placeholder="输入其他..."
                        />
                    </div>
                </div>

                {/* 高级字段：状态（默认使用中）+ 类别（默认通用） */}
                <AdvancedOptions label="更多选项（状态、类别）">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">状态</label>
                            <Select
                                name="status"
                                defaultValue={DEFAULT_ITEM_STATUS}
                                className="h-12 bg-base/50"
                            >
                                {itemStatusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">类别</label>
                            <CustomSelect
                                name="category"
                                defaultValue={DEFAULT_ITEM_CATEGORY}
                                placeholder="输入自定义类别..."
                                className="h-12 bg-surface"
                                options={itemCategoryOptions}
                            />
                        </div>
                    </div>
                </AdvancedOptions>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className={`h-11 rounded-lg px-8 text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center justify-center min-w-[8rem] ${isSuccess
                        ? "bg-success text-white hover:bg-success"
                        : "bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-md"
                        }`}
                    disabled={isSuccess || isLoading}
                >
                    {isSuccess ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            <IconCheck className="h-5 w-5" />
                            <span>已添加</span>
                        </div>
                    ) : (
                        "添加物品"
                    )}
                </button>
            </div>
        </form>
    );
}
