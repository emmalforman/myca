import { NextResponse } from "next/server";
import { sampleMembers } from "@/data/members";
import { Member } from "@/lib/types";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function GET() {
  if (hasSupabase()) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name");

    if (error) {
      console.error("Supabase fetch failed:", error.message);
      return NextResponse.json(
        { members: sampleMembers, source: "sample", error: error.message },
        { status: 200 }
      );
    }

    const members: Member[] = (data || []).map((row: any) => ({
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

    return NextResponse.json({
      members: members.length > 0 ? members : sampleMembers,
      source: members.length > 0 ? "supabase" : "sample",
    });
  }

  return NextResponse.json({ members: sampleMembers, source: "sample" });
}
