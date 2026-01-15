import type { AnniversaryDateType } from "@/lib/anniversary";

export type UpcomingItem =
  | {
      kind: "todo";
      at: Date;
      id: string;
      title: string;
    }
  | {
      kind: "anniversary";
      at: Date;
      id: string;
      title: string;
      dateType: AnniversaryDateType;
    }
  | {
      kind: "subscription";
      at: Date;
      id: string;
      name: string;
    };
