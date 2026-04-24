import type { AnniversaryDateType } from "@/lib/anniversary";

/**
 * `at` is typed as Date | string because Next.js serializes Date across the
 * RSC boundary as an ISO string. Server-side this is a Date; after it lands
 * in a client component it's a string. Always coerce with `new Date(u.at)`
 * before calling Date methods.
 */
export type UpcomingItem =
  | {
      kind: "todo";
      at: Date | string;
      id: string;
      title: string;
    }
  | {
      kind: "anniversary";
      at: Date | string;
      id: string;
      title: string;
      dateType: AnniversaryDateType;
    }
  | {
      kind: "subscription";
      at: Date | string;
      id: string;
      name: string;
    };
