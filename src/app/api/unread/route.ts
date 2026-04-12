import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/unread?email=user@example.com
 *
 * Returns { count: number } — the total number of unread messages across
 * the user's group channels and DM channels.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ count: 0 });
  }

  // 1. Get group channels the user is a member of
  const { data: channelRows } = await supabaseAdmin
    .from("channel_members")
    .select("channel")
    .eq("email", email);

  const groupChannels: string[] = (channelRows || [])
    .map((r: any) => r.channel)
    .filter((ch: string) => ch !== "_onboarded");

  // 2. Get DM channels involving this user
  const { data: dmRows } = await supabaseAdmin
    .from("messages")
    .select("channel")
    .like("channel", `dm:%${email}%`)
    .limit(100);

  const dmChannels: string[] = [
    ...new Set((dmRows || []).map((r: any) => r.channel)),
  ];

  const allChannels = [...groupChannels, ...dmChannels];
  if (allChannels.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // 3. Get last_read_at for each channel
  const { data: readRows } = await supabaseAdmin
    .from("channel_last_read")
    .select("channel, last_read_at")
    .eq("email", email)
    .in("channel", allChannels);

  const lastReadMap = new Map<string, string>();
  (readRows || []).forEach((r: any) => {
    lastReadMap.set(r.channel, r.last_read_at);
  });

  // 4. Count unread messages per channel
  let totalUnread = 0;

  for (const ch of allChannels) {
    const lastRead = lastReadMap.get(ch) || "1970-01-01T00:00:00Z";
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("channel", ch)
      .gt("created_at", lastRead)
      .neq("sender_email", email);

    totalUnread += count || 0;
  }

  return NextResponse.json({ count: totalUnread });
}
