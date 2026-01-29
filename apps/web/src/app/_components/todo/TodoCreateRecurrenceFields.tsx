import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { todoRecurrenceUnitOptions } from "./TodoRecurrence.types";

export function TodoCreateRecurrenceFields() {
    return (
        <>
            <label className="flex flex-col gap-1 text-xs text-secondary">
                重复
                <Select name="recurrenceUnit" defaultValue="" className="bg-surface">
                    <option value="">不重复</option>
                    {todoRecurrenceUnitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-secondary">
                间隔
                <Input
                    type="number"
                    name="recurrenceInterval"
                    defaultValue={1}
                    min={1}
                    className="bg-surface"
                />
            </label>

            <p className="text-xs text-muted sm:col-span-2">
                提示：重复任务需设置截止时间；完成后会自动生成下一次。
            </p>
        </>
    );
}
