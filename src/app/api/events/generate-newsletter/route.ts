import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  if (!isAdmin(user.email)) return forbiddenResponse();

  const { startDate, endDate, introTheme } = await request.json();

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("status", "approved")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  if (!events?.length) {
    return NextResponse.json(
      { error: "No approved events found for this date range" },
      { status: 404 }
    );
  }

  const eventList = events
    .map((e: any) => {
      const parts = [
        `- **${e.title}**`,
        e.host ? `  Host: ${e.host}${e.host_company ? ` (${e.host_company})` : ""}` : "",
        `  Date: ${e.day_of_week || ""} ${e.date}${e.start_time ? ` at ${e.start_time}` : ""}`,
        e.location ? `  Location: ${e.location}` : "",
        e.description ? `  Description: ${e.description.slice(0, 200)}` : "",
        e.is_myca_member_event ? `  [MYCA MEMBER EVENT]` : "",
        e.personal_note ? `  Emma's note: ${e.personal_note}` : "",
        e.rsvp_url ? `  RSVP: ${e.rsvp_url}` : "",
        e.cover_image_url ? `  Image: ${e.cover_image_url}` : "",
      ];
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const dateRange = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const systemPrompt = `You are writing the weekly Myca Collective newsletter for Substack. Emma Forman is the author - she runs Myca, a members-only community for food, beverage, and CPG founders, operators, and investors.

The newsletter is called "What to do in NYC (+SF) this week" and covers events happening in the food/CPG/community space.

Emma's voice: warm, enthusiastic, community-driven. Uses "!!" occasionally. Creates FOMO. Casual but smart. Talks like a connected insider who genuinely wants her community to show up.

FORMAT:
1. Title: "What to do in NYC (+SF) this week (${dateRange})"
2. One-line subtitle (fun, topical)
3. Byline date
4. Short Myca pitch (1-2 sentences about the collective)
5. Personal intro (1-2 paragraphs, reference the theme if given)
6. Events listed as ## headers, each with:
   - The event image if available: ![event](IMAGE_URL)
   - A 2-3 sentence blurb making it sound unmissable
   - Date, time, location on one line
   - RSVP link
   - If it's a Myca member event, call that out warmly
7. Closing CTA to join Myca / subscribe

Include ALL events. Keep each blurb tight - 2-3 sentences max.`;

  const userPrompt = `Here are this week's events (${dateRange}):

${eventList}

${introTheme ? `Theme/context for the intro: ${introTheme}` : "Write a general intro about what's happening this week in the food/CPG world."}

Generate the full newsletter in markdown.`;

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "API not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const result = await response.json();
    const newsletter = result.content?.[0]?.text || "Failed to generate newsletter";

    return NextResponse.json({ newsletter, eventCount: events.length, dateRange });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate newsletter" },
      { status: 500 }
    );
  }
}
