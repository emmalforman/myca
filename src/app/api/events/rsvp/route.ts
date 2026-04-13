import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — fetch RSVPs for an event (or all events in a date range)
export async function GET(request: NextRequest) {
  const sb = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const eventIds = searchParams.get("eventIds"); // comma-separated

  if (eventId) {
    const { data, error } = await sb
      .from("event_rsvps")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rsvps: data });
  }

  if (eventIds) {
    const ids = eventIds.split(",").filter(Boolean);
    const { data, error } = await sb
      .from("event_rsvps")
      .select("*")
      .in("event_id", ids)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by event_id
    const grouped: Record<string, any[]> = {};
    for (const rsvp of data || []) {
      if (!grouped[rsvp.event_id]) grouped[rsvp.event_id] = [];
      grouped[rsvp.event_id].push(rsvp);
    }
    return NextResponse.json({ rsvpsByEvent: grouped });
  }

  return NextResponse.json({ error: "eventId or eventIds required" }, { status: 400 });
}

// POST — RSVP to an event
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { eventId } = await request.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  // Get member info for display
  const { data: member } = await sb
    .from("members")
    .select("full_name, photo_url")
    .eq("email", user.email)
    .single();

  const { data, error } = await sb.from("event_rsvps").insert({
    event_id: eventId,
    member_email: user.email,
    member_name: member?.full_name || user.email?.split("@")[0],
    member_photo_url: member?.photo_url || null,
  }).select().single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already RSVPd" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rsvp: data });
}

// DELETE — remove RSVP
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { eventId } = await request.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("member_email", user.email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
