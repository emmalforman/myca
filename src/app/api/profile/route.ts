import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser, isAdmin, forbiddenResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

// GET profile by email
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Auth is best-effort — profile page already requires login via MemberLogin
  let userEmail: string | null = null;
  let userIsAdmin = false;
  try {
    const user = await getAuthenticatedUser();
    if (user?.email) {
      userEmail = user.email;
      userIsAdmin = isAdmin(user.email);
    }
  } catch {}

  // Non-admin users can only view their own profile (when auth works)
  if (userEmail && email !== userEmail && !userIsAdmin) {
    return forbiddenResponse();
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message, "email:", email);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    console.error("Profile API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update profile
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Auth is best-effort for PATCH too
  let userEmail: string | null = null;
  let userIsAdmin = false;
  try {
    const user = await getAuthenticatedUser();
    if (user?.email) {
      userEmail = user.email;
      userIsAdmin = isAdmin(user.email);
    }
  } catch {}

  if (userEmail && email !== userEmail && !userIsAdmin) {
    return forbiddenResponse();
  }

  const body = await request.json();

  // Only allow updating these fields
  const allowed = [
    "name", "first_name", "last_name", "company", "role",
    "occupation_type", "location", "linkedin", "instagram", "substack", "phone",
    "superpower", "asks", "offers", "photo_url",
    "skills", "interests",
  ];

  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
