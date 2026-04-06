import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");

  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Get all introductions with contact names
  const { data: intros, error } = await supabase
    .from("introductions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get all contact IDs referenced
  const contactIds = new Set<string>();
  (intros || []).forEach((i: any) => {
    if (i.person_a_id) contactIds.add(i.person_a_id);
    if (i.person_b_id) contactIds.add(i.person_b_id);
  });

  // Fetch contact names
  let contactMap: Record<string, any> = {};
  if (contactIds.size > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("contact_id,name,email,company,role,photo_url")
      .in("contact_id", [...contactIds]);

    (contacts || []).forEach((c: any) => {
      contactMap[c.contact_id] = c;
    });
  }

  // Enrich intros with contact info
  const enriched = (intros || []).map((intro: any) => ({
    ...intro,
    person_a: contactMap[intro.person_a_id] || null,
    person_b: contactMap[intro.person_b_id] || null,
  }));

  return NextResponse.json({ introductions: enriched });
}
