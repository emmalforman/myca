import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

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

  // Get admin's contact_id
  const adminEmail = process.env.ADMIN_EMAIL || "";
  let adminContactId: string | null = null;
  if (adminEmail) {
    const { data: adminContact } = await supabase
      .from("contacts")
      .select("contact_id")
      .eq("email", adminEmail)
      .single();
    adminContactId = adminContact?.contact_id || null;
  }

  // Enrich intros with contact info and categorize
  const enriched = (intros || []).map((intro: any) => {
    const isAdminIntro = adminContactId && (
      intro.person_a_id === adminContactId || intro.person_b_id === adminContactId
    );
    return {
      ...intro,
      person_a: contactMap[intro.person_a_id] || null,
      person_b: contactMap[intro.person_b_id] || null,
      is_admin_intro: !!isAdminIntro,
    };
  });

  return NextResponse.json({ introductions: enriched, adminContactId });
}
