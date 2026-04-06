import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Auto-join a member to channels based on their profile
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Get the member's profile
  const { data: contact } = await supabase
    .from("contacts")
    .select("name, location, occupation_type")
    .eq("email", email)
    .eq("is_myca_member", true)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const channels: string[] = ["general"];

  // Auto-join location channels
  const location = (contact.location || "").toLowerCase();
  if (location.includes("new york")) channels.push("nyc");
  if (location.includes("san francisco")) channels.push("sf");
  if (location.includes("los angeles")) channels.push("la");
  if (location.includes("london")) channels.push("london");
  if (location.includes("chicago")) channels.push("chicago");
  if (location.includes("europe") || location.includes("london") || location.includes("paris") || location.includes("berlin")) {
    if (!channels.includes("europe")) channels.push("europe");
  }

  // Auto-join role channels (these are validated by profile match)
  const role = (contact.occupation_type || "").toLowerCase();
  if (role.includes("founder")) channels.push("founders");
  if (role.includes("investor")) channels.push("investors");
  if (role.includes("operator")) channels.push("operators");

  // Always join jobs-asks
  channels.push("jobs-asks");

  // Upsert channel memberships
  const rows = channels.map((ch) => ({ channel: ch, email }));
  const { error } = await supabase
    .from("channel_members")
    .upsert(rows, { onConflict: "channel,email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ channels, name: contact.name });
}

// GET channels for a member
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ channels: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from("channel_members")
    .select("channel")
    .eq("email", email);

  return NextResponse.json({
    channels: (data || []).map((d: any) => d.channel),
  });
}
