"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { updateDateReminderTime } from "@/app/_actions/settings";
import { useToast } from "@/app/_components/Toast";

type DateReminderFormProps = {
    initialTime: string;
};

export function DateReminderForm({ initialTime }: DateReminderFormProps) {
    const [time, setTime] = useState(initialTime);
    const [isPending, setIsPending] = useState(false);
    const { success, error } = useToast();

    const isDirty = time !== initialTime;

    const handleSubmit = async (formData: FormData) => {
        setIsPending(true);
        try {
            await updateDateReminderTime(formData);
            success("保存成功");
        } catch (err) {
            error("保存失败");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form action={handleSubmit} className="flex items-center gap-3">
            <div className="relative">
                <Input
                    type="time"
                    name="dateReminderTime"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="h-10 w-32 text-sm font-medium bg-surface border-default focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all rounded-xl"
                />
            </div>

            <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isPending}
                className={`
                    h-10 px-4 rounded-xl transition-all duration-300 flex items-center gap-1.5
                    ${isDirty
                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:brightness-110 active:scale-95"
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"}
                `}
            >
                {isPending ? (
                    <Icon icon="ri:loader-4-line" className="animate-spin h-4 w-4" />
                ) : (
                    <>
                        {isDirty ? <Icon icon="ri:save-3-line" className="h-4 w-4" /> : <Icon icon="ri:check-line" className="h-4 w-4" />}
                        <span>{isDirty ? "保存" : "已保存"}</span>
                    </>
                )}
            </Button>
        </form>
    );
}
