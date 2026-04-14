import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Myca, the helpful concierge for the Myca Collective — a curated community of women in food, CPG, agriculture, and hospitality. Members come to you to find the right person to connect with.

You help members find the right people to connect with. When a member asks a question like "who can help me with retail distribution" or "I'm looking for a co-packer in NYC", you review the pre-filtered member profiles below and recommend the best matches.

RULES:
1. Always respond conversationally and warmly — you're a trusted community concierge, not a search engine.
2. When recommending members, return them in a structured format (see below).
3. Recommend 1-5 members max per query. Quality over quantity.
4. Explain WHY each person is a good match based on their profile.
5. If no good matches exist, say so honestly and suggest what they might try instead.
6. You can also answer general questions about the community.
7. Keep responses concise — a brief intro sentence, then the recommendations.
8. Never make up information. Only use what's in the member profiles.
9. When searching, consider ALL profile fields — company names, titles, notes, offers, asks, skills, and interests can all indicate relevance. Infer industry from company names (e.g. a vodka or wine company = alcohol/beverage industry).
10. Read through EVERY member profile carefully before answering. Do not skip profiles or stop early.

When recommending members, include this exact format for EACH recommendation (the frontend will parse this):
<member-card>
{"email":"member@email.com","reason":"Brief reason why they're a match"}
</member-card>

The reason should be 1-2 sentences explaining the connection.`;

function buildMemberContext(members: any[]): string {
  return members
    .map((m) => {
      const parts = [`Name: ${m.name}`];
      if (m.company) parts.push(`Company: ${m.company}`);
      if (m.role) parts.push(`Title: ${m.role}`);
      if (m.occupation_type) parts.push(`Role type: ${m.occupation_type}`);
      if (m.location) parts.push(`Location: ${m.location}`);
      if (m.industry_tags) parts.push(`Industry: ${m.industry_tags}`);
      if (m.skills) parts.push(`Skills: ${m.skills}`);
      if (m.interests) parts.push(`Interests: ${m.interests}`);
      if (m.superpower) parts.push(`Superpower: ${m.superpower}`);
      if (m.offers) parts.push(`Offers: ${m.offers}`);
      if (m.asks) parts.push(`Looking for: ${m.asks}`);
      if (m.focus_areas) parts.push(`Focus: ${m.focus_areas}`);
      if (m.notes) parts.push(`Notes: ${m.notes}`);
      if (m.communities) parts.push(`Communities: ${m.communities}`);
      parts.push(`Email: ${m.email}`);
      return parts.join(" | ");
    })
    .join("\n");
}

export async function POST(request: Request) {
  // Auth check — only logged-in members can use the bot
  // Try cookie-based auth first, fall back to Bearer token from client
  const { getAuthenticatedUser, unauthorizedResponse } = await import("@/lib/auth");
  let user = await getAuthenticatedUser();

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const { createClient: createAnonClient } = await import("@supabase/supabase-js");
        const supabaseAuth = createAnonClient(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data } = await supabaseAuth.auth.getUser(token);
        user = data.user;
      }
    }
  }

  if (!user) return unauthorizedResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "API not configured" },
      { status: 500 }
    );
  }

  // Rate limit: 20 bot queries per hour per user
  const { checkRateLimit, rateLimitResponse } = await import("@/lib/rate-limit");
  const rl = checkRateLimit({ name: "bot", max: 20, windowSeconds: 3600 }, user.email!);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { message, email, history, source, sessionId } = await request.json();

  if (!message || !email) {
    return NextResponse.json(
      { error: "Message and email required" },
      { status: 400 }
    );
  }

  // Look up sender name for chat messages
  let senderName = email.split("@")[0];

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up sender name
  const { data: senderData } = await supabase
    .from("contacts")
    .select("name, first_name")
    .eq("email", email)
    .eq("is_myca_member", true)
    .limit(1);
  if (senderData?.[0]) {
    senderName = senderData[0].name || senderData[0].first_name || senderName;
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Two-pass search: find relevant members instead of loading all
  const { searchMembers } = await import("@/lib/member-search");

  // Include recent user messages in search query for better context on follow-ups
  const searchQuery =
    history && Array.isArray(history) && history.length > 0
      ? [
          ...history
            .filter((m: any) => m.role === "user")
            .slice(-2)
            .map((m: any) => m.content),
          message,
        ].join(" ")
      : message;

  const { members, totalCount } = await searchMembers(
    supabase,
    anthropic,
    searchQuery,
    email,
    25
  );

  if (!members || members.length === 0) {
    return NextResponse.json({
      reply: "I don't have any member data to search through right now. Please try again later.",
      recommendations: [],
    });
  }

  const memberContext = buildMemberContext(members);

  // Build conversation history
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  // Include recent history for context (last 6 messages)
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-6)) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  messages.push({ role: "user", content: message });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\nHere are the most relevant members for this query (${members.length} of ${totalCount} total community members):\n\n${memberContext}`,
    messages,
  });

  const replyText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse out member card recommendations
  const cardRegex = /<member-card>\s*(\{[^}]+\})\s*<\/member-card>/g;
  const recommendations: { email: string; reason: string }[] = [];
  let match;
  while ((match = cardRegex.exec(replyText)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.email) {
        recommendations.push({
          email: parsed.email,
          reason: parsed.reason || "",
        });
      }
    } catch {}
  }

  // Clean the reply text (remove the raw member-card tags for display)
  const cleanReply = replyText
    .replace(/<member-card>\s*\{[^}]+\}\s*<\/member-card>/g, "")
    .trim();

  // Log the query for analytics (fire-and-forget, don't block the response)
  supabase.from("bot_queries").insert({
    user_email: email,
    query: message,
    reply: cleanReply,
    recommended_emails: recommendations.map((r) => r.email),
    source: source || "chat",
    session_id: sessionId || null,
  }).then(() => {});

  // Save to chat so the conversation is visible in the AI Chat channel
  if (source === "home") {
    // Save user's question
    supabase.from("messages").insert({
      channel: "ai-chat",
      sender_email: email,
      sender_name: senderName,
      content: message,
    }).then(() => {});

    // Save Myca's reply
    supabase.from("messages").insert({
      channel: "ai-chat",
      sender_email: "myca@mycacollective.com",
      sender_name: "Myca",
      content: cleanReply,
    }).then(() => {});
  }

  return NextResponse.json({
    reply: cleanReply,
    recommendations,
  });
}
