import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  // Rate limit DMs: 15 per hour, 50 per day
  const hourly = checkRateLimit(
    { name: "outreach-hourly", max: 15, windowSeconds: 3600 },
    user.email!
  );
  if (!hourly.allowed) return rateLimitResponse(hourly.resetAt);

  const daily = checkRateLimit(
    { name: "outreach-daily", max: 50, windowSeconds: 86400 },
    user.email!
  );
  if (!daily.allowed) return rateLimitResponse(daily.resetAt);

  const { recipientEmail, recipientId, message } = await request.json();

  if (!recipientEmail || !message?.trim()) {
    return NextResponse.json({ error: "Recipient and message are required" }, { status: 400 });
  }

  // Limit message length
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 });
  }

  // Prevent self-messaging
  if (recipientEmail === user.email) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  // Get sender name
  const { data: senderContact } = await supabase
    .from("contacts")
    .select("name, contact_id")
    .eq("email", user.email)
    .single();

  const senderName = senderContact?.name || user.email!.split("@")[0];

  // Create DM channel ID (sorted emails)
  const channelId = `dm:${[user.email!, recipientEmail].sort().join(":")}`;

  // Send the message
  const { error: msgError } = await supabase.from("messages").insert({
    channel: channelId,
    sender_email: user.email,
    sender_name: senderName,
    content: message.trim(),
  });

  if (msgError) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Register both users in the DM channel
  await supabase
    .from("channel_members")
    .upsert(
      [
        { channel: channelId, email: user.email },
        { channel: channelId, email: recipientEmail },
      ],
      { onConflict: "channel,email" }
    );

  // Log the outreach as an introduction
  if (senderContact?.contact_id && recipientId) {
    try {
      await supabase.from("introductions").insert({
        person_a_id: senderContact.contact_id,
        person_b_id: recipientId,
        status: "outreach_sent",
        context: "Direct message via Myca",
      });
    } catch {};
  }

  return NextResponse.json({ success: true, channelId });
}
