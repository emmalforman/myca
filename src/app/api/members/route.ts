import { NextResponse } from "next/server";
import { sampleMembers } from "@/data/members";
import { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function hasNotion() {
  return !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID);
}

export async function GET() {
  // Try Supabase contacts table first
  if (hasSupabase()) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("is_myca_member", true)
      .order("name");

    if (!error && data && data.length > 0) {
      const members: Member[] = data.map((row: any) => ({
        id: row.contact_id,
        notionId: row.notion_id ?? undefined,
        name: row.name ?? "",
        firstName: row.first_name ?? undefined,
        lastName: row.last_name ?? undefined,
        email: row.email ?? "",
        phone: row.phone ?? undefined,
        linkedin: row.linkedin ?? undefined,
        company: row.company ?? undefined,
        role: row.role ?? undefined,
        occupationType: row.occupation_type ?? undefined,
        location: row.location ?? undefined,
        industryTags: row.industry_tags ?? undefined,
        focusAreas: row.focus_areas ?? undefined,
        superpower: row.superpower ?? undefined,
        asks: row.asks ?? undefined,
        offers: row.offers ?? undefined,
        notes: row.notes ?? undefined,
        communities: row.communities ?? undefined,
        cohortTags: row.cohort_tags ?? undefined,
        warmth: row.warmth ?? undefined,
        photoUrl: undefined, // TODO: add photo_url to contacts table
      }));

      return NextResponse.json({ members, source: "supabase" });
    }

    if (error) {
      console.error("Supabase fetch failed:", error.message);
    }
  }

  // Fall back to Notion directly
  if (hasNotion()) {
    try {
      const { fetchMembersFromNotion } = await import("@/lib/notion");
      const notionMembers = await fetchMembersFromNotion();
      if (notionMembers.length > 0) {
        // Map Notion members to the Member interface
        const members: Member[] = notionMembers.map((m: any) => ({
          id: m.id,
          name: m.fullName || `${m.firstName} ${m.lastName}`.trim(),
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          linkedin: m.linkedin,
          company: m.company,
          role: m.title,
          occupationType: m.occupation,
          location: Array.isArray(m.location) ? m.location.join(", ") : m.location,
          photoUrl: m.photoUrl,
        }));
        return NextResponse.json({ members, source: "notion" });
      }
    } catch (error: any) {
      console.error("Notion fetch failed:", error.message);
    }
  }

  return NextResponse.json({ members: sampleMembers, source: "sample" });
}
