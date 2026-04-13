import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST: log that a member clicked "Apply"
export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser();
  } catch {}

  const body = await request.json();
  const { jobId, memberName, memberEmail } = body;

  if (!jobId || !memberEmail) {
    return NextResponse.json({ error: "jobId and memberEmail required" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Upsert to avoid duplicate entries (same member, same job)
  const { error } = await supabaseAdmin
    .from("job_applications")
    .upsert(
      {
        job_id: jobId,
        member_name: memberName || "Unknown",
        member_email: memberEmail,
        clicked_at: new Date().toISOString(),
      },
      { onConflict: "job_id,member_email" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET: fetch applicants for a job (or all jobs)
export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser();
  } catch {}

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from("job_applications")
    .select("*")
    .order("clicked_at", { ascending: false });

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({
    applications: (data || []).map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      memberName: row.member_name,
      memberEmail: row.member_email,
      clickedAt: row.clicked_at,
    })),
  });
}
