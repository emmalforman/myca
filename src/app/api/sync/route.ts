import { NextResponse } from "next/server";
import { fetchMembersFromNotion } from "@/lib/notion";

export async function POST() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return NextResponse.json(
      { error: "Notion is not configured. Set NOTION_API_KEY and NOTION_DATABASE_ID environment variables." },
      { status: 400 }
    );
  }

  try {
    const members = await fetchMembersFromNotion();
    return NextResponse.json({
      members,
      source: "notion",
      syncedAt: new Date().toISOString(),
      count: members.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
