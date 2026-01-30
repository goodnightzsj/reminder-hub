import { Input } from "@/app/_components/ui/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { Textarea } from "@/app/_components/ui/Textarea";

import { formatDateTime } from "@/lib/format";
import { subscriptionReminderOptionsDays } from "@/lib/reminder-options";
import {
  subscriptionCategoryOptions,
  subscriptionCycleUnitOptions,
} from "@/lib/subscriptions";


type SubscriptionFormItem = {
  id: string;
  name: string;
  category: string;
  nextRenewDate: string;
  autoRenew: boolean;
  cycleUnit: string;
  cycleInterval: number;
  priceCents: number | null;
  currency: string;
  description: string | null;
};

type ReminderPreview = {
  days: number;
  label: string;
  at: Date;
};

type SubscriptionEditFormProps = {
  item: SubscriptionFormItem;
  offsets: number[];
  preview: ReminderPreview[];
  timeZone: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function SubscriptionEditForm({
  item,
  offsets,
  preview,
  timeZone,
  action,
}: SubscriptionEditFormProps) {
  const now = new Date();

  return (
    <form id="subscription-edit-form" action={action} className="space-y-8">
      <input type="hidden" name="id" value={item.id} />

      <div className="rounded-xl border border-default bg-elevated relative">
        <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary">
          基本信息
        </div>
        <div className="p-4 grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">名称</label>
              <Input name="name" defaultValue={item.name} required className="h-10 bg-base/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">分类</label>
              <CustomSelect
                name="category"
                defaultValue={item.category}
                placeholder="输入自定义..."
                className="h-10 bg-base/50"
                options={subscriptionCategoryOptions}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">下次到期日</label>
            <SmartDateInput name="nextRenewDate" defaultValue={item.nextRenewDate} required className="h-10 bg-base/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">自动续费</label>
            <div className="flex h-10 items-center rounded-lg border border-default bg-base/50 px-3">
              <input type="checkbox" name="autoRenew" value="1" defaultChecked={item.autoRenew} className="h-4 w-4 rounded border-emphasis text-brand-primary" />
              <span className="ml-3 text-sm text-primary">启用</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">周期单位</label>
            <Select name="cycleUnit" defaultValue={item.cycleUnit} className="h-10 bg-base/50">
              {subscriptionCycleUnitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">周期间隔</label>
            <Input type="number" name="cycleInterval" defaultValue={item.cycleInterval} min={1} className="h-10 bg-base/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">金额</label>
            <Input type="number" name="price" step="0.01" min="0" defaultValue={typeof item.priceCents === "number" ? (item.priceCents / 100).toString() : ""} className="h-10 bg-base/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">币种</label>
            <Input name="currency" defaultValue={item.currency} className="h-10 bg-base/50" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-secondary mb-1.5">备注</label>
            <Textarea name="description" rows={3} defaultValue={item.description ?? ""} className="resize-y bg-base/50" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-default bg-elevated relative">
        <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary flex items-center justify-between">
          <span>提醒设置</span>
          <span className="text-[10px] text-muted font-normal">可多选</span>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {subscriptionReminderOptionsDays.map((opt) => (
              <label key={opt.days} className="flex items-center gap-2 rounded-lg border border-divider bg-surface/50 px-4 py-2 text-sm cursor-pointer hover:bg-interactive-hover transition-colors">
                <input type="checkbox" name="remindOffsetsDays" value={opt.days} defaultChecked={offsets.includes(opt.days)} className="h-4 w-4 rounded border-emphasis text-brand-primary" />
                {opt.label}
              </label>
            ))}
          </div>
          {preview.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {preview.map((p) => {
                const isPast = p.at.getTime() < now.getTime();
                return (
                  <span key={p.days} className={`rounded-md border px-2 py-1 text-[10px] font-medium ${isPast ? "border-danger/30 bg-danger/10 text-danger" : "border-divider bg-surface text-secondary"}`}>
                    {p.label}：{formatDateTime(p.at, timeZone)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
