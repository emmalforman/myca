import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

// GET all applications
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data });
}

// PATCH accept or reject an application
export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { id, status: newStatus } = body;

  if (!id || !["accepted", "rejected"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  // Update application status
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If accepted, add to contacts table
  if (newStatus === "accepted") {
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (app) {
      const { error: insertError } = await supabase.from("contacts").upsert(
        {
          name: app.full_name,
          email: app.email,
          phone: app.phone || null,
          company: app.company || null,
          role: app.title || null,
          occupation_type: app.occupation || null,
          location: Array.isArray(app.location) ? app.location.join(", ") : app.location || null,
          linkedin: app.linkedin || null,
          photo_url: app.photo_url || null,
          is_myca_member: true,
        },
        { onConflict: "email" }
      );

      if (insertError) {
        return NextResponse.json({
          status: newStatus,
          warning: `Application accepted but contact creation failed: ${insertError.message}`,
        });
      }
    }
  }

  return NextResponse.json({ status: newStatus, id });
}
