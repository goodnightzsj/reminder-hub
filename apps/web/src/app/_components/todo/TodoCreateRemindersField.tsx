import { type TodoReminderOption } from "@/lib/todo";

type TodoCreateRemindersFieldProps = {
    reminderOptions: readonly TodoReminderOption[];
};

export function TodoCreateRemindersField({ reminderOptions }: TodoCreateRemindersFieldProps) {
    return (
        <fieldset className="mt-1">
            <legend className="text-xs text-secondary">
                提醒（可多选，需设置截止）
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
                {reminderOptions.map((opt) => (
                    <label
                        key={opt.minutes}
                        className="inline-flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs text-primary hover:bg-interactive-hover active:bg-interactive-hover/80 transition-colors cursor-pointer select-none"
                    >
                        <input
                            type="checkbox"
                            name="reminderOffsetsMinutes"
                            value={opt.minutes}
                            className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

