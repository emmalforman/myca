import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["emmalforman7@gmail.com", "emma@mycacollective.com"];

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function checkAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return isAdmin(email) || ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("job_sources")
    .select("*")
    .order("company_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({
    sources: (data || []).map((row: any) => ({
      id: row.id,
      companyName: row.company_name,
      platform: row.platform,
      slug: row.slug,
      category: row.category,
      isActive: row.is_active,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  let userEmail: string | null = null;
  try {
    const user = await getAuthenticatedUser();
    userEmail = user?.email || null;
  } catch {}

  const body = await request.json();
  const effectiveEmail = userEmail || body.adminEmail;
  if (!checkAdmin(effectiveEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("job_sources")
    .insert({
      company_name: body.companyName,
      platform: body.platform,
      slug: body.slug,
      category: body.category || "other",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ source: data });
}

export async function PATCH(request: NextRequest) {
  let userEmail: string | null = null;
  try {
    const user = await getAuthenticatedUser();
    userEmail = user?.email || null;
  } catch {}

  const body = await request.json();
  const effectiveEmail = userEmail || body.adminEmail;
  if (!checkAdmin(effectiveEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const dbUpdates: any = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.companyName) dbUpdates.company_name = updates.companyName;
  if (updates.category) dbUpdates.category = updates.category;

  const { error } = await supabaseAdmin
    .from("job_sources")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let userEmail: string | null = null;
  try {
    const user = await getAuthenticatedUser();
    userEmail = user?.email || null;
  } catch {}

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const adminEmail = searchParams.get("adminEmail");
  const effectiveEmail = userEmail || adminEmail;

  if (!checkAdmin(effectiveEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("job_sources")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
