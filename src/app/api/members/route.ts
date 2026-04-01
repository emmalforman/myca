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
    // Dynamic import to avoid errors when env vars aren't set
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("first_name");

    if (error) {
      console.error("Supabase fetch failed:", error.message);
      return NextResponse.json(
        { members: sampleMembers, source: "sample", error: error.message },
        { status: 200 }
      );
    }

    const members: Member[] = (data || []).map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      title: row.title ?? undefined,
      company: row.company ?? undefined,
      location: row.location ?? undefined,
      industry: row.industry ?? undefined,
      bio: row.bio ?? undefined,
      tags: row.tags ?? [],
      linkedin: row.linkedin ?? undefined,
      twitter: row.twitter ?? undefined,
      website: row.website ?? undefined,
      joinedDate: row.joined_date ?? undefined,
    }));

    return NextResponse.json({
      members: members.length > 0 ? members : sampleMembers,
      source: members.length > 0 ? "supabase" : "sample",
    });
  }

  return NextResponse.json({ members: sampleMembers, source: "sample" });
}
