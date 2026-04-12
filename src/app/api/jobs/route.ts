import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "approved";
  const all = searchParams.get("all");

  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!all || !isAdmin(user.email)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  const jobs = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    locationType: row.location_type,
    type: row.type,
    description: row.description,
    applyUrl: row.apply_url,
    applyEmail: row.apply_email,
    salaryRange: row.salary_range,
    submittedByName: row.submitted_by_name,
    submittedByEmail: row.submitted_by_email,
    status: row.status,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();

  const row: any = {
    title: body.title,
    company: body.company,
    location: body.location || null,
    location_type: body.locationType || "onsite",
    type: body.type || "full-time",
    description: body.description,
    apply_url: body.applyUrl || null,
    apply_email: body.applyEmail || null,
    salary_range: body.salaryRange || null,
    submitted_by_name: body.submittedByName || null,
    submitted_by_email: body.submittedByEmail || null,
    status: "pending",
  };

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to submit job" }, { status: 500 });
  }
  return NextResponse.json({ job: data, created: true });
}

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
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ job: data });
}
