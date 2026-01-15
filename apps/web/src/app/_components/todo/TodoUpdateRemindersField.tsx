import { type TodoReminderOption } from "@/lib/todo";

type TodoUpdateRemindersFieldProps = {
    reminderOptions: readonly TodoReminderOption[];
    reminders: number[];
};

export function TodoUpdateRemindersField({
    reminderOptions,
    reminders,
}: TodoUpdateRemindersFieldProps) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                提醒设置
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {reminderOptions.map((opt) => (
                    <label
                        key={opt.minutes}
                        className="relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-xl border border-default bg-surface/50 p-2 text-center transition-all hover:bg-interactive-hover active:scale-95 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/5 has-[:checked]:text-brand-primary"
                    >
                        <input
                            type="checkbox"
                            name="reminderOffsetsMinutes"
                            value={opt.minutes}
                            defaultChecked={reminders.includes(opt.minutes)}
                            className="peer sr-only"
                        />
                        <span className="text-sm font-medium leading-none">{opt.label}</span>
                        <div className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-transparent transition-colors peer-checked:bg-brand-primary" />
                    </label>
                ))}
            </div>
        </div>
    );
}
