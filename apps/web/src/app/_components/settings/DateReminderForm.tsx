"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@iconify/react";
import { Button } from "@/app/_components/ui/Button";
import { TimeInput } from "@/app/_components/TimeInput";
import { updateDateReminderTime } from "@/app/_actions/settings";

type DateReminderFormProps = {
  initialTime: string;
};

function DateReminderSubmitButton({ isDirty }: { isDirty: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={!isDirty || pending}
      className={`
        h-10 px-4 rounded-xl transition-all duration-300 flex items-center gap-1.5
        ${
          isDirty
            ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:brightness-110 active:scale-95"
            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
        }
      `}
    >
      {pending ? (
        <Icon icon="ri:loader-4-line" className="animate-spin h-4 w-4" />
      ) : (
        <>
          {isDirty ? (
            <Icon icon="ri:save-3-line" className="h-4 w-4" />
          ) : (
            <Icon icon="ri:check-line" className="h-4 w-4" />
          )}
          <span>{isDirty ? "保存" : "已保存"}</span>
        </>
      )}
    </Button>
  );
}

export function DateReminderForm({ initialTime }: DateReminderFormProps) {
  const [time, setTime] = useState(initialTime);
  const isDirty = time !== initialTime;

  return (
    <form action={updateDateReminderTime} className="flex items-center gap-3">
      <div className="relative">
        <TimeInput
          name="dateReminderTime"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="h-10 w-32"
        />
      </div>

      <DateReminderSubmitButton isDirty={isDirty} />
    </form>
  );
}
