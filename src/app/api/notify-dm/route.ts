import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Cooldown: only one email per recipient per 30 minutes
const COOLDOWN_MINUTES = 30;

/**
 * POST /api/notify-dm
 * Body: { recipientEmail, senderName }
 *
 * Sends an email notification to the DM recipient. Anti-spam:
 *  - 30-minute cooldown per recipient (at most 1 email per 30 min)
 *  - Skip if RESEND_API_KEY is not configured
 */
export async function POST(request: Request) {
  try {
    const { recipientEmail, senderName } = await request.json();

    if (!recipientEmail || !senderName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Skip if Resend is not configured
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ skipped: "email_not_configured" });
    }

    // Check cooldown: was this recipient emailed in the last 30 minutes?
    const { data: logEntry } = await supabaseAdmin
      .from("dm_notification_log")
      .select("last_notified_at")
      .eq("recipient_email", recipientEmail)
      .single();

    if (logEntry) {
      const lastNotified = new Date(logEntry.last_notified_at);
      const cooldownEnd = new Date(
        lastNotified.getTime() + COOLDOWN_MINUTES * 60 * 1000
      );
      if (new Date() < cooldownEnd) {
        return NextResponse.json({ skipped: "cooldown" });
      }
    }

    // Verify the recipient is an actual member
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("name")
      .eq("email", recipientEmail)
      .eq("is_myca_member", true)
      .single();

    if (!contact) {
      return NextResponse.json({ skipped: "not_member" });
    }

    const recipientFirst = contact.name?.split(" ")[0] || "there";

    // Send email via Resend
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const fromAddress =
      process.env.EMAIL_FROM || "Myca Collective <notifications@mycacollective.com>";

    await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: `${senderName} sent you a message on Myca`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #999; margin-bottom: 24px;">
            Myca Collective
          </p>
          <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
            Hi ${recipientFirst},
          </p>
          <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
            <strong>${senderName}</strong> sent you a direct message on Myca.
          </p>
          <a href="https://mycacollective.com/chat"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #1a3a2a; color: #faf9f6; text-decoration: none; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">
            View Message
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            You're receiving this because someone messaged you on Myca.
            You won't get another notification for at least ${COOLDOWN_MINUTES} minutes.
          </p>
        </div>
      `,
    });

    // Update the notification log
    await supabaseAdmin
      .from("dm_notification_log")
      .upsert(
        {
          recipient_email: recipientEmail,
          last_notified_at: new Date().toISOString(),
        },
        { onConflict: "recipient_email" }
      );

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error("notify-dm error:", err);
    return NextResponse.json(
      { error: "Notification failed" },
      { status: 500 }
    );
  }
}
