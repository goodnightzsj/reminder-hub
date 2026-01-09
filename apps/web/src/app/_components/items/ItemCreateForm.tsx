"use client";

"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { createItem } from "@/app/_actions/items";
import { Icons } from "@/app/_components/Icons";
import { useToast } from "@/app/_components/Toast";

type ItemCreateFormProps = {
    className?: string; // Allow overriding styles
};

export function ItemCreateForm({ className = "" }: ItemCreateFormProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);
    const { success } = useToast();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createItem(formData);

            setIsSuccess(true);
            success("创建成功");
            setFormKey(prev => prev + 1);
            formRef.current?.reset();

            setTimeout(() => {
                setIsSuccess(false);
                if (searchParams.get("modal") === "create") {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("modal");
                    router.replace(`${pathname}?${params.toString()}`);
                }
            }, 1000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className={`flex flex-col gap-5 ${className}`}>
            <div key={formKey} className="contents">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">物品名称</label>
                        <Input
                            name="name"
                            placeholder="新增物品（如 键盘 / 咖啡机 / 跑鞋）"
                            className="h-12 bg-surface"
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div className="w-full sm:w-40">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">状态</label>
                        <Select name="status" defaultValue="using" className="h-12 bg-base/50">
                            <option value="using">使用中</option>
                            <option value="idle">闲置</option>
                            <option value="retired">淘汰</option>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">购入日期</label>
                        <SmartDateInput type="date" name="purchasedDate" className="h-12 bg-base/50" />
                    </div>

                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="mb-1.5 block text-xs font-medium text-secondary">类别</label>
                        <CustomSelect
                            name="category"
                            placeholder="输入自定义类别..."
                            className="h-12 bg-surface"
                            options={[
                                { value: "数码", label: "数码" },
                                { value: "家居", label: "家居" },
                                { value: "衣物", label: "衣物" },
                                { value: "虚拟", label: "虚拟" },
                                { value: "运动", label: "运动" },
                            ]}
                        />
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
                            defaultValue="CNY"
                            className="h-12 bg-surface"
                            options={[
                                { value: "CNY", label: "CNY (人民币)" },
                                { value: "USD", label: "USD (美元)" },
                                { value: "JPY", label: "JPY (日元)" },
                                { value: "EUR", label: "EUR (欧元)" },
                                { value: "GBP", label: "GBP (英镑)" },
                                { value: "HKD", label: "HKD (港币)" },
                            ]}
                            placeholder="输入其他..."
                        />
                    </div>
                </div>


            </div>

            <div className="flex justify-end pt-2">
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
                            <Icons.Check className="h-5 w-5" />
                            <span>已添加</span>
                        </div>
                    ) : (
                        "添加物品"
                    )}
                </button>
            </div>
        </form >
    );
}
