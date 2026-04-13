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

  // Look up the logged-in user's name from contacts
  let firstName = "";

  // Try exact email match first
  let { data: meData } = await supabase
    .from("contacts")
    .select("first_name, name")
    .ilike("email", user.email || "")
    .limit(1);

  // If not found, try without is_myca_member constraint (some contacts may not have it set)
  if (!meData?.length) {
    const { data: altData } = await supabase
      .from("contacts")
      .select("first_name, name, email")
      .order("name")
      .limit(500);
    // Try partial email match (e.g. "emmalforman" in "emma@company.com")
    const emailPrefix = (user.email || "").split("@")[0].toLowerCase();
    const match = altData?.find((c: any) =>
      c.email?.toLowerCase().includes(emailPrefix) ||
      emailPrefix.includes(c.email?.split("@")[0]?.toLowerCase() || "___")
    );
    if (match) meData = [match];
  }

  if (meData?.[0]) {
    firstName = meData[0].first_name || meData[0].name?.split(" ")[0] || "";
  }

  // Fallback: try Supabase auth user metadata
  if (!firstName && user.user_metadata?.full_name) {
    firstName = user.user_metadata.full_name.split(" ")[0];
  }
  if (!firstName && user.user_metadata?.name) {
    firstName = user.user_metadata.name.split(" ")[0];
  }

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
    firstName,
    asks: askMessages || [],
    events: events || [],
  });
}
