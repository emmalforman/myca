import { NextResponse } from "next/server";
import { fetchMembersFromNotion } from "@/lib/notion";
import { sampleMembers } from "@/data/members";

export async function GET() {
  // If Notion is configured, fetch from Notion; otherwise use sample data
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    try {
      const members = await fetchMembersFromNotion();
      return NextResponse.json({ members, source: "notion" });
    } catch (error: any) {
      console.error("Notion fetch failed:", error.message);
      return NextResponse.json(
        { members: sampleMembers, source: "sample", error: error.message },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ members: sampleMembers, source: "sample" });
}
