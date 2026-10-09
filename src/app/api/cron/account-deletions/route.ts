import { NextResponse } from "next/server";
import { processDueDeletions } from "@/lib/account-deletion";

/**
 * Daily (vercel.json "crons"): erases accounts whose 30-day grace period has
 * ended. Vercel sends "Authorization: Bearer $CRON_SECRET"; anything else is
 * refused, so this can't be triggered from outside.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processDueDeletions();
  return NextResponse.json(result);
}
