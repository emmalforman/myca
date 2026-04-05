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
  // Try Supabase first
  if (hasSupabase()) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name");

    if (!error && data && data.length > 0) {
      const members: Member[] = data.map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        firstName: row.first_name ?? "",
        lastName: row.last_name ?? "",
        email: row.email,
        phone: row.phone ?? undefined,
        photoUrl: row.photo_url ?? undefined,
        title: row.title ?? undefined,
        company: row.company ?? undefined,
        occupation: row.occupation ?? undefined,
        location: row.location ?? [],
        linkedin: row.linkedin ?? undefined,
        comfortFood: row.comfort_food ?? undefined,
        hopingToGet: row.hoping_to_get ?? undefined,
        excitedToContribute: row.excited_to_contribute ?? undefined,
        asksAndOffers: row.asks_and_offers ?? undefined,
        attendedEvents: row.attended_events ?? [],
        joinedDate: row.created_at ?? undefined,
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
      const members = await fetchMembersFromNotion();
      if (members.length > 0) {
        return NextResponse.json({ members, source: "notion" });
      }
    } catch (error: any) {
      console.error("Notion fetch failed:", error.message);
    }
  }

  // Last resort: sample data
  return NextResponse.json({ members: sampleMembers, source: "sample" });
}
