import { NextResponse } from "next/server";
import { fetchMembersFromNotion } from "@/lib/notion";

export async function POST() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return NextResponse.json(
      { error: "Notion is not configured. Set NOTION_API_KEY and NOTION_DATABASE_ID." },
      { status: 400 }
    );
  }

  try {
    const notionMembers = await fetchMembersFromNotion();

    // Upsert into Supabase if configured
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const { supabaseAdmin } = await import("@/lib/supabase-admin");

      const rows = notionMembers.map((m) => ({
        full_name: m.fullName,
        first_name: m.firstName || null,
        last_name: m.lastName || null,
        email: m.email,
        phone: m.phone || null,
        photo_url: m.photoUrl || null,
        title: m.title || null,
        company: m.company || null,
        occupation: m.occupation || null,
        location: m.location,
        linkedin: m.linkedin || null,
        comfort_food: m.comfortFood || null,
        hoping_to_get: m.hopingToGet || null,
        excited_to_contribute: m.excitedToContribute || null,
        asks_and_offers: m.asksAndOffers || null,
        attended_events: m.attendedEvents || [],
        notion_id: m.id,
      }));

      const { error } = await supabaseAdmin.from("members").upsert(rows, {
        onConflict: "notion_id",
      });

      if (error) {
        console.error("Supabase upsert failed:", error.message);
      }

      return NextResponse.json({
        members: notionMembers,
        source: error ? "notion" : "notion+supabase",
        syncedAt: new Date().toISOString(),
        count: notionMembers.length,
      });
    }

    return NextResponse.json({
      members: notionMembers,
      source: "notion",
      syncedAt: new Date().toISOString(),
      count: notionMembers.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
