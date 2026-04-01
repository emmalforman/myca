import { NextResponse } from "next/server";
import { fetchMembersFromNotion } from "@/lib/notion";

export async function POST() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return NextResponse.json(
      {
        error:
          "Notion is not configured. Set NOTION_API_KEY and NOTION_DATABASE_ID environment variables.",
      },
      { status: 400 }
    );
  }

  try {
    const notionMembers = await fetchMembersFromNotion();

    // If Supabase is configured, upsert members into the database
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const { supabaseAdmin } = await import("@/lib/supabase-admin");

      const rows = notionMembers.map((m) => ({
        first_name: m.firstName,
        last_name: m.lastName,
        email: m.email,
        phone: m.phone || null,
        photo_url: m.photoUrl || null,
        title: m.title || null,
        company: m.company || null,
        location: m.location || null,
        industry: m.industry || null,
        bio: m.bio || null,
        tags: m.tags,
        linkedin: m.linkedin || null,
        twitter: m.twitter || null,
        website: m.website || null,
        joined_date: m.joinedDate || null,
        notion_id: m.id,
      }));

      const { error } = await supabaseAdmin.from("members").upsert(rows, {
        onConflict: "notion_id",
      });

      if (error) {
        console.error("Supabase upsert failed:", error.message);
        return NextResponse.json(
          {
            members: notionMembers,
            source: "notion",
            persisted: false,
            error: error.message,
            syncedAt: new Date().toISOString(),
            count: notionMembers.length,
          },
          { status: 200 }
        );
      }

      return NextResponse.json({
        members: notionMembers,
        source: "notion+supabase",
        persisted: true,
        syncedAt: new Date().toISOString(),
        count: notionMembers.length,
      });
    }

    // No Supabase — just return Notion data
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
