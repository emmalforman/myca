import { NextResponse } from "next/server";
import { sampleMembers } from "@/data/members";
import { Member } from "@/lib/types";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function sanitizeMember(member: Member, userIsAdmin: boolean): Partial<Member> {
  if (userIsAdmin) return member;
  const { email, phone, notes, warmth, ...safe } = member;
  return safe;
}

export async function GET() {
  let userIsAdmin = false;

  // Try server-side auth, but don't block if it fails
  // (the directory page already requires login via MemberLogin)
  try {
    const user = await getAuthenticatedUser();
    if (user?.email) {
      userIsAdmin = isAdmin(user.email);
    }
  } catch {}

  // Try Supabase contacts table
  if (hasSupabase()) {
    try {
      const { supabase } = await import("@/lib/supabase");

      // First try with is_myca_member filter
      let { data, error } = await supabase
        .from("contacts")
        .select("contact_id,notion_id,name,first_name,last_name,email,phone,linkedin,instagram,substack,company,role,occupation_type,location,industry_tags,focus_areas,skills,interests,superpower,asks,offers,notes,communities,cohort_tags,warmth,photo_url,created_at")
        .eq("is_myca_member", true)
        .order("name");

      // If that returns nothing, try without the filter
      if (!error && (!data || data.length === 0)) {
        const result = await supabase
          .from("contacts")
          .select("contact_id,name,photo_url")
          .order("name")
          .limit(5);

        if (result.error) {
          console.error("Supabase contacts query failed:", result.error.message);
          return NextResponse.json({ members: [], source: "error" }, { status: 500 });
        }

        if (result.data && result.data.length > 0) {
          const allResult = await supabase
            .from("contacts")
            .select("contact_id,notion_id,name,first_name,last_name,email,phone,linkedin,instagram,substack,company,role,occupation_type,location,industry_tags,focus_areas,skills,interests,superpower,asks,offers,notes,communities,cohort_tags,warmth,photo_url,created_at")
            .order("name");
          data = allResult.data;
          error = allResult.error;
        }
      }

      if (error) {
        console.error("Supabase fetch failed:", error.message);
        return NextResponse.json({ members: [], source: "error" }, { status: 500 });
      }

      if (data && data.length > 0) {
        const members: Member[] = data.map((row: any) => ({
          id: row.contact_id || row.id,
          notionId: row.notion_id ?? undefined,
          name: row.name ?? "",
          firstName: row.first_name ?? undefined,
          lastName: row.last_name ?? undefined,
          email: row.email ?? "",
          phone: row.phone ?? undefined,
          linkedin: row.linkedin ?? undefined,
          instagram: row.instagram ?? undefined,
          substack: row.substack ?? undefined,
          company: row.company ?? undefined,
          role: row.role ?? undefined,
          occupationType: row.occupation_type ?? undefined,
          location: row.location ?? undefined,
          industryTags: row.industry_tags ?? undefined,
          focusAreas: row.focus_areas ?? undefined,
          skills: row.skills ?? undefined,
          interests: row.interests ?? undefined,
          superpower: row.superpower ?? undefined,
          asks: row.asks ?? undefined,
          offers: row.offers ?? undefined,
          notes: row.notes ?? undefined,
          communities: row.communities ?? undefined,
          cohortTags: row.cohort_tags ?? undefined,
          warmth: row.warmth ?? undefined,
          photoUrl: row.photo_url ?? undefined,
          createdAt: row.created_at ?? undefined,
        }));

        return NextResponse.json({
          members: members.map((m) => sanitizeMember(m, userIsAdmin)),
          source: "supabase",
          count: members.length,
        });
      }
    } catch (err: any) {
      console.error("Supabase connection error:", err.message);
      return NextResponse.json({ members: [], source: "error" }, { status: 500 });
    }
  }

  return NextResponse.json({
    members: sampleMembers.map((m) => sanitizeMember(m, userIsAdmin)),
    source: "sample",
  });
}
