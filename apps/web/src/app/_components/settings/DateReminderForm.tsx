"use client";

import { useState } from "react";
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
        <form action={handleSubmit} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-secondary">
                默认提醒时刻（HH:MM）
            </label>
            <Input
                type="time"
                name="dateReminderTime"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
            />

            <Button
                type="submit"
                variant="primary"
                className="self-start"
                disabled={!isDirty || isPending}
            >
                {isPending ? "保存中..." : "保存"}
            </Button>
        </form>
    );
}
