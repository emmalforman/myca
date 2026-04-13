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

export async function GET() {
  // Try Supabase contacts table
  if (hasSupabase()) {
    try {
      const { supabase } = await import("@/lib/supabase");

      // First try with is_myca_member filter
      let { data, error } = await supabase
        .from("contacts")
        .select("contact_id,notion_id,name,first_name,last_name,email,phone,linkedin,company,role,occupation_type,location,industry_tags,focus_areas,superpower,asks,offers,notes,communities,cohort_tags,warmth,photo_url,tier")
        .eq("is_myca_member", true)
        .order("name");

      // If that returns nothing, try without the filter (maybe column doesn't exist or isn't set)
      if (!error && (!data || data.length === 0)) {
        console.log("No members with is_myca_member=true, trying all contacts...");
        const result = await supabase
          .from("contacts")
          .select("contact_id,name,photo_url")
          .order("name")
          .limit(5);

        if (result.error) {
          console.error("Supabase contacts query failed:", result.error.message);
          return NextResponse.json({
            members: sampleMembers,
            source: "sample",
            debug: { error: result.error.message, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL },
          });
        }

        // If we got results without the filter, use all contacts
        if (result.data && result.data.length > 0) {
          const allResult = await supabase
            .from("contacts")
            .select("contact_id,notion_id,name,first_name,last_name,email,phone,linkedin,company,role,occupation_type,location,industry_tags,focus_areas,superpower,asks,offers,notes,communities,cohort_tags,warmth,photo_url,tier")
            .order("name");
          data = allResult.data;
          error = allResult.error;
        }
      }

      if (error) {
        console.error("Supabase fetch failed:", error.message);
        return NextResponse.json({
          members: sampleMembers,
          source: "sample",
          debug: { error: error.message },
        });
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
          photoUrl: row.photo_url ?? undefined,
          tier: row.tier ?? undefined,
        }));

        return NextResponse.json({
          members,
          source: "supabase",
          count: members.length,
        });
      }
    } catch (err: any) {
      console.error("Supabase connection error:", err.message);
      return NextResponse.json({
        members: sampleMembers,
        source: "sample",
        debug: { error: err.message },
      });
    }
  }

  return NextResponse.json({
    members: sampleMembers,
    source: "sample",
    debug: { hasSupabase: hasSupabase(), url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing", key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing" },
  });
}
