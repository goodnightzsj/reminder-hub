import { Button } from "@/app/_components/ui/Button";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { clearFailedDeliveries } from "@/app/_actions/notifications";

import type { ChannelType } from "./NotificationSettings.types";

export function ChannelEnabledToggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export function SaveConfigButton() {
  return (
    <div className="pt-2">
      <Button type="submit" variant="primary" className="w-full active-press">
        保存配置
      </Button>
    </div>
  );
}

export function ActionButtons({
  channel,
  onTest,
  onRun,
}: {
  channel: ChannelType;
  onTest: () => Promise<void>;
  onRun: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 border border-divider">
      <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        <form action={onTest} className="contents">
          <Button type="submit" variant="outline" size="sm" className="h-8 text-[11px] active-press">
            发送测试
          </Button>
        </form>
        <form action={onRun} className="contents">
          <Button type="submit" variant="outline" size="sm" className="h-8 text-[11px] active-press">
            执行通知
          </Button>
        </form>
        <form action={clearFailedDeliveries} className="contents">
          <input type="hidden" name="channel" value={channel} />
          <ConfirmSubmitButton
            confirmMessage="确定清理失败记录吗？"
            className="h-8 rounded-lg border border-divider px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press transition-colors"
          >
            清理失败
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

