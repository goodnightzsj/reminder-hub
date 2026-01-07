"use client";

"use client";

import { Input } from "@/app/_components/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { createItem } from "@/app/_actions/items";

export function ItemCreateForm() {
    return (
        <form action={createItem} className="flex flex-col gap-5">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-xs font-medium text-secondary">购入日期</label>
                    <SmartDateInput type="date" name="purchasedDate" className="h-12 bg-base/50" />
                </div>

                <div className="sm:col-span-1">
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

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    className="h-11 rounded-lg bg-brand-primary px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-primary/90 hover:shadow-md active:scale-95"
                >
                    添加物品
                </button>
            </div>
        </form>
    );
}
