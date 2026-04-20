import type { ReactNode } from "react";

import { BentoCard } from "../shared/BentoCard";
import { NumberTicker } from "../shared/NumberTicker";
import { TiltCard } from "../shared/TiltCard";

type DashboardStatCardProps = {
  icon: ReactNode;
  iconWrapperClassName: string;
  value: number;
  tickerDelay: number;
  label: string;
  cardDelay: number;
};

export function DashboardStatCard({
  icon,
  iconWrapperClassName,
  value,
  tickerDelay,
  label,
  cardDelay,
}: DashboardStatCardProps) {
  return (
    <TiltCard className="col-span-1 lg:col-span-1" maxRotation={6}>
      <BentoCard className="h-full" delay={cardDelay} compact>
        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
          <div className={iconWrapperClassName}>{icon}</div>
          <div className="font-display text-3xl font-bold leading-none tabular-nums text-primary">
            <NumberTicker value={value} delay={tickerDelay} />
          </div>
          <div className="text-[11px] font-medium text-muted tracking-wide uppercase">{label}</div>
        </div>
      </BentoCard>
    </TiltCard>
  );
}

