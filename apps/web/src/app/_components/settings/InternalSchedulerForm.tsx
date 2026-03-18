"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@iconify/react";

import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { TimeInput } from "@/app/_components/TimeInput";
import { updateInternalSchedulerSettings } from "@/app/_actions/settings";

export type InternalSchedulerSettings = {
  internalSchedulerEnabled: boolean;
  internalNotifyEnabled: boolean;
  internalNotifyIntervalSeconds: number;
  internalWeeklyDigestEnabled: boolean;
  internalMonthlyDigestEnabled: boolean;
  internalDigestTime: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" className="h-10 px-5 rounded-xl">
      {pending ? (
        <>
          <Icon icon="ri:loader-4-line" className="h-4 w-4 animate-spin" />
          <span className="ml-1">保存中</span>
        </>
      ) : (
        <>
          <Icon icon="ri:save-3-line" className="h-4 w-4" />
          <span className="ml-1">保存设置</span>
        </>
      )}
    </Button>
  );
}

export function InternalSchedulerForm({ initial }: { initial: InternalSchedulerSettings }) {
  const [enabled, setEnabled] = useState(initial.internalSchedulerEnabled);
  const [digestTime, setDigestTime] = useState(initial.internalDigestTime);

  return (
    <form action={updateInternalSchedulerSettings} className="space-y-4">
      <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
        <input
          type="checkbox"
          name="internalSchedulerEnabled"
          value="1"
          defaultChecked={initial.internalSchedulerEnabled}
          className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">启用系统内定时任务</span>
          <span className="text-xs text-secondary">
            无需外部 Cron，只要服务运行就会定时发送。
          </span>
        </div>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">通知扫描间隔（秒）</span>
            <span className="text-[10px] text-muted">建议 300（5 分钟）</span>
          </div>
          <Input
            name="internalNotifyIntervalSeconds"
            type="number"
            inputMode="numeric"
            min={60}
            max={86400}
            defaultValue={initial.internalNotifyIntervalSeconds}
            disabled={!enabled}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">周报 / 月报发送时间</span>
            <span className="text-[10px] text-muted">按应用时区</span>
          </div>
          <TimeInput
            name="internalDigestTime"
            value={digestTime}
            onChange={(e) => setDigestTime(e.target.value)}
            required
            disabled={!enabled}
            className="h-11 w-full"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border border-transparent ${enabled ? "hover:bg-muted/5 hover:border-divider cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
          <input
            type="checkbox"
            name="internalNotifyEnabled"
            value="1"
            defaultChecked={initial.internalNotifyEnabled}
            disabled={!enabled}
            className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
          />
          <span className="text-sm font-medium">定时执行到期通知（Todo / 纪念日 / 订阅）</span>
        </label>

        <label className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border border-transparent ${enabled ? "hover:bg-muted/5 hover:border-divider cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
          <input
            type="checkbox"
            name="internalWeeklyDigestEnabled"
            value="1"
            defaultChecked={initial.internalWeeklyDigestEnabled}
            disabled={!enabled}
            className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
          />
          <span className="text-sm font-medium">周报（上周总结 + 本周计划，周一生成）</span>
        </label>

        <label className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border border-transparent ${enabled ? "hover:bg-muted/5 hover:border-divider cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
          <input
            type="checkbox"
            name="internalMonthlyDigestEnabled"
            value="1"
            defaultChecked={initial.internalMonthlyDigestEnabled}
            disabled={!enabled}
            className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
          />
          <span className="text-sm font-medium">月报（上月总结 + 本月计划，每月 1 号生成）</span>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

