import { NextResponse } from "next/server";
import { getMemberAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const access = await getMemberAccess(email);

  if (!access) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({
    tier: access.tier,
    isPaid: access.isPaid,
    isFree: access.isFree,
    isFounding: access.isFounding,
    isTrialing: access.isTrialing,
    trialDaysLeft: access.trialDaysLeft,
    canSendIntro: access.canSendIntro,
    canAccessChat: access.canAccessChat,
    canAccessEvents: access.canAccessEvents,
    canAccessJobs: access.canAccessJobs,
    canPostEvents: access.canPostEvents,
    canPostJobs: access.canPostJobs,
    introsUsed: access.introsUsed,
    introsLimit: access.introsLimit,
    introsRemaining: access.introsRemaining,
  });
}
