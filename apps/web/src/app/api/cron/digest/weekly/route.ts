import { DIGEST_TYPE } from "@/lib/digests";
import { handleDigestCron } from "@/server/digest-cron-handler";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleDigestCron(request, DIGEST_TYPE.WEEKLY);
}

export async function GET(request: Request) {
  return POST(request);
}
