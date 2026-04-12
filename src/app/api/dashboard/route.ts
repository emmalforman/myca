import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabaseAdmin();

  // Fetch recent messages from jobs-asks channel
  const { data: askMessages } = await supabase
    .from("messages")
    .select("id, sender_name, sender_email, content, created_at")
    .eq("channel", "jobs-asks")
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch upcoming approved events (next 30 days)
  const today = new Date().toISOString().split("T")[0];
  const thirtyDays = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, host, host_company, date, day_of_week, start_time, location, city, rsvp_url, cover_image_url"
    )
    .eq("status", "approved")
    .gte("date", today)
    .lte("date", thirtyDays)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(4);

  return NextResponse.json({
    asks: askMessages || [],
    events: events || [],
  });
}
