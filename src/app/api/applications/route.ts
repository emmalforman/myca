import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { buildAcceptanceEmail } from "@/lib/emails/acceptance";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

// GET all applications — admin only
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

// PATCH accept or reject an application — admin only
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
          instagram: app.instagram || null,
          skills: app.skills || null,
          interests: app.interests || null,
          superpower: app.superpower || null,
          asks: app.asks || app.hoping_to_get || null,
          offers: app.offers || app.excited_to_contribute || null,
          industry_tags: app.industry_focus || null,
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

      // Send acceptance email
      let emailWarning: string | undefined;
      try {
        const { subject, html } = buildAcceptanceEmail(app.full_name);
        const { data: emailResult } = await resend.emails.send({
          from: "Emma @ Myca <hello@mycacollective.com>",
          to: app.email,
          subject,
          html,
        });

        if (emailResult?.id) {
          await supabase
            .from("applications")
            .update({ email_id: emailResult.id, email_status: "sent" })
            .eq("id", id);
        }
      } catch (emailErr: any) {
        emailWarning = `Acceptance email failed: ${emailErr.message}`;
        await supabase
          .from("applications")
          .update({ email_status: "failed" })
          .eq("id", id);
      }

      if (emailWarning) {
        return NextResponse.json({ status: newStatus, id, warning: emailWarning });
      }
    }
  }

  // If rejected, revoke membership — but only if there's no other accepted application
  if (newStatus === "rejected") {
    const { data: app } = await supabase
      .from("applications")
      .select("email")
      .eq("id", id)
      .single();

    if (app?.email) {
      const { data: otherAccepted } = await supabase
        .from("applications")
        .select("id")
        .eq("email", app.email)
        .eq("status", "accepted")
        .neq("id", id)
        .limit(1);

      if (!otherAccepted || otherAccepted.length === 0) {
        await supabase
          .from("contacts")
          .update({ is_myca_member: false })
          .eq("email", app.email);
      }
    }
  }

  return NextResponse.json({ status: newStatus, id });
}
