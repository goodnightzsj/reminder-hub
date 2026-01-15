import { Input } from "../Input";
import { Select } from "../Select";
import { Icons } from "../Icons";
import { todoRecurrenceUnitEveryOptions, type TodoRecurrence, type TodoRecurrenceUnit } from "./TodoRecurrence.types";
import { isRecurrenceUnit } from "@/lib/recurrence";

type TodoUpdateRecurrenceFieldProps = {
    recurrence: TodoRecurrence | null;
    recurrenceUnit: TodoRecurrenceUnit | "";
    onRecurrenceUnitChange: (nextUnit: TodoRecurrenceUnit | "") => void;
};

export function TodoUpdateRecurrenceField({
    recurrence,
    recurrenceUnit,
    onRecurrenceUnitChange,
}: TodoUpdateRecurrenceFieldProps) {
    return (
        <div className="space-y-2 rounded-xl border border-default bg-surface/30 p-4 transition-colors hover:border-emphasis hover:bg-surface/50">
            <label className="flex items-center gap-2 text-xs font-medium text-secondary">
                <Icons.Refresh className="h-4 w-4" />
                重复设置
            </label>
            <div className="flex gap-2">
                <Select
                    name="recurrenceUnit"
                    value={recurrenceUnit}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || isRecurrenceUnit(value)) {
                            onRecurrenceUnitChange(value);
                        }
                    }}
                    className="bg-transparent shadow-none focus:ring-0"
                >
                    <option value="">不重复</option>
                    {todoRecurrenceUnitEveryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
                {recurrenceUnit !== "" && (
                    <Input
                        type="number"
                        name="recurrenceInterval"
                        defaultValue={recurrence?.interval ?? 1}
                        min={1}
                        className="w-20 bg-transparent shadow-none focus:ring-0"
                    />
                )}
            </div>
        </div>
    );
}
