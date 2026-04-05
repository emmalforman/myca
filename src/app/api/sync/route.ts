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

    // Upsert into Supabase contacts table if configured
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const { supabaseAdmin } = await import("@/lib/supabase-admin");

      const rows = notionMembers.map((m: any) => ({
        name: m.fullName || m.name || `${m.firstName} ${m.lastName}`.trim(),
        first_name: m.firstName || null,
        last_name: m.lastName || null,
        email: m.email,
        phone: m.phone || null,
        company: m.company || null,
        role: m.title || m.role || null,
        occupation_type: m.occupation || m.occupationType || null,
        location: Array.isArray(m.location) ? m.location.join(", ") : m.location || null,
        linkedin: m.linkedin || null,
        notion_id: m.id,
        is_myca_member: true,
      }));

      const { error } = await supabaseAdmin.from("contacts").upsert(rows, {
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
