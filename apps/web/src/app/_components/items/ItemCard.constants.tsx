"use client";

import type { ReactElement } from "react";

import { Icons } from "../Icons";
import { ITEM_STATUS, type ItemStatus } from "@/lib/items";

export const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export type StatusTransitionAction = {
  nextStatus: ItemStatus;
  tooltip: string;
  className: string;
  icon: ReactElement;
};

export const ITEM_STATUS_ACTIONS = {
  [ITEM_STATUS.USING]: [
    {
      nextStatus: ITEM_STATUS.IDLE,
      tooltip: "标志为'闲置'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.Coffee className="h-5 w-5" />,
    },
    {
      nextStatus: ITEM_STATUS.RETIRED,
      tooltip: "标志为'淘汰'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-white shadow-lg shadow-zinc-600/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.History className="h-5 w-5" />,
    },
  ],
  [ITEM_STATUS.IDLE]: [
    {
      nextStatus: ITEM_STATUS.RETIRED,
      tooltip: "标志为'淘汰'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-white shadow-lg shadow-zinc-600/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.History className="h-5 w-5" />,
    },
    {
      nextStatus: ITEM_STATUS.USING,
      tooltip: "将状态恢复为'使用中'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.ArchiveRestore className="h-5 w-5" />,
    },
  ],
  [ITEM_STATUS.RETIRED]: [
    {
      nextStatus: ITEM_STATUS.IDLE,
      tooltip: "标志为'闲置'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.Coffee className="h-5 w-5" />,
    },
    {
      nextStatus: ITEM_STATUS.USING,
      tooltip: "将状态恢复为'使用中'",
      className:
        "flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 active:scale-95 transition-all",
      icon: <Icons.ArchiveRestore className="h-5 w-5" />,
    },
  ],
} as const satisfies Record<ItemStatus, readonly StatusTransitionAction[]>;

