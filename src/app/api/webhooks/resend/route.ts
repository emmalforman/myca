import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

// Resend sends webhook events for email status changes
export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  // Map Resend event types to simple statuses
  const statusMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.delivery_delayed": "delayed",
  };

  const emailStatus = statusMap[type];
  if (!emailStatus || !data?.email_id) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Don't downgrade status (e.g. don't overwrite "opened" with "delivered")
  const priority = ["sent", "delayed", "delivered", "opened", "clicked", "bounced", "complained"];
  const { data: app } = await supabase
    .from("applications")
    .select("email_status")
    .eq("email_id", data.email_id)
    .single();

  if (app) {
    const currentPriority = priority.indexOf(app.email_status || "");
    const newPriority = priority.indexOf(emailStatus);
    if (newPriority > currentPriority) {
      await supabase
        .from("applications")
        .update({ email_status: emailStatus })
        .eq("email_id", data.email_id);
    }
  }

  return NextResponse.json({ ok: true });
}
