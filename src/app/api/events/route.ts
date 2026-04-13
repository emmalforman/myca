import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const rl = checkRateLimit({ name: "events-read", max: 60, windowSeconds: 60 }, user.email!);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const city = searchParams.get("city");
  const status = searchParams.get("status") || "approved";
  const all = searchParams.get("all");

  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  // Only admins can bypass the status filter
  if (!all || !isAdmin(user.email)) {
    query = query.eq("status", status);
  }
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (city) query = query.eq("city", city);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  const events = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    host: row.host,
    hostCompany: row.host_company,
    description: row.description,
    date: row.date,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    city: row.city,
    rsvpUrl: row.rsvp_url,
    rsvpPlatform: row.rsvp_platform,
    coverImageUrl: row.cover_image_url,
    source: row.source,
    sourceEventId: row.source_event_id,
    submittedByName: row.submitted_by_name,
    submittedByEmail: row.submitted_by_email,
    isMycaMemberEvent: row.is_myca_member_event,
    isFeatured: row.is_featured,
    status: row.status,
    personalNote: row.personal_note,
    newsletterIncluded: row.newsletter_included,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();

  const row: any = {
    title: body.title,
    host: body.host || null,
    host_company: body.hostCompany || null,
    description: body.description || null,
    date: body.date,
    day_of_week: body.dayOfWeek || null,
    start_time: body.startTime || null,
    end_time: body.endTime || null,
    location: body.location || null,
    city: body.city || "New York",
    rsvp_url: body.rsvpUrl || null,
    rsvp_platform: body.rsvpPlatform || null,
    cover_image_url: body.coverImageUrl || null,
    source: body.source || "manual",
    source_event_id: body.sourceEventId || null,
    submitted_by_name: body.submittedByName || null,
    submitted_by_email: body.submittedByEmail || null,
    is_myca_member_event: body.isMycaMemberEvent || false,
    is_featured: body.isFeatured || false,
    status: body.status || "pending",
    personal_note: body.personalNote || null,
  };

  // Deduplicate by source_event_id
  if (row.source_event_id) {
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("source_event_id", row.source_event_id)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("events")
        .update(row)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      return NextResponse.json({ event: data, updated: true });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({ event: data, created: true });
}

// PATCH: admin only — approve, add notes, toggle featured
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.personalNote !== undefined) dbUpdates.personal_note = updates.personalNote;
  if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
  if (updates.isMycaMemberEvent !== undefined) dbUpdates.is_myca_member_event = updates.isMycaMemberEvent;
  if (updates.newsletterIncluded !== undefined) dbUpdates.newsletter_included = updates.newsletterIncluded;
  if (updates.coverImageUrl !== undefined) dbUpdates.cover_image_url = updates.coverImageUrl;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { data, error } = await supabaseAdmin
    .from("events")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ event: data });
}
