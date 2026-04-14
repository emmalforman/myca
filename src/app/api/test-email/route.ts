import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { buildAcceptanceEmail } from "@/lib/emails/acceptance";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/test-email?to=someone@example.com — admin only, for debugging
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || "emmalforman7@gmail.com";

  const log: string[] = [];

  try {
    log.push(`Building email for: ${to}`);
    const { subject, html } = buildAcceptanceEmail("Test User");
    log.push(`Email built. Subject: ${subject}`);

    log.push(`RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
    log.push(`RESEND_API_KEY prefix: ${process.env.RESEND_API_KEY?.slice(0, 6) || "MISSING"}`);

    const result = await resend.emails.send({
      from: "Emma @ Myca <hello@mycacollective.com>",
      to,
      subject,
      html,
    });

    log.push(`Resend result: ${JSON.stringify(result)}`);

    return NextResponse.json({ success: true, log, result });
  } catch (err: any) {
    log.push(`Exception: ${err.message}`);
    return NextResponse.json({ success: false, log, error: err.message });
  }
}
