import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CALENDAR_ID =
  "72d5cbf7b73472173cc716299b9cf655d66ec91c4b7b6e6025567ccc2a760b18@group.calendar.google.com";

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Helpers (same logic as scripts/sync-calendar.ts) ───

function stripHtml(html: string): string {
  return html
    .replace(/<a[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function extractUrl(desc: string | undefined): string | null {
  if (!desc) return null;
  const clean = stripHtml(desc);
  const patterns = [
    /https:\/\/luma\.com\/event\/evt-[^\s"<&,)]+/,
    /https:\/\/luma\.com\/[a-z0-9]+/i,
    /https:\/\/partiful\.com\/e\/[^\s"<&,)]+/,
    /https:\/\/resy\.com\/[^\s"<&,)]+/,
    /https:\/\/www\.eventbrite\.com\/[^\s"<&,)]+/,
    /https?:\/\/[^\s"<&,)]+/,
  ];
  for (const pat of patterns) {
    const match = clean.match(pat);
    if (match) {
      let url = match[0].replace(/[.,;:)\]]+$/, "");
      if (url.includes("google.com/url")) continue;
      if (url.includes("/event/manage/")) continue;
      return url;
    }
  }
  return null;
}

function cleanDescription(desc: string | undefined): string | null {
  if (!desc) return null;
  let clean = stripHtml(desc);
  clean = clean.replace(/Get up-to-date information at:\s*https?:\/\/\S+\n*/gi, "");
  clean = clean.replace(/You are hosting this event\.[^\n]*\n*/gi, "");
  clean = clean.replace(/Manage the event at[^\n]*\n*/gi, "");
  clean = clean.replace(/View the public page at[^\n]*\n*/gi, "");
  clean = clean.replace(/Address:\n[^\n]+\n(?:[^\n]+\n)?(?:United States\n?)?/gi, "");
  clean = clean.replace(/^https?:\/\/\S+$/gm, "");
  clean = clean.replace(/Full details at:\s*https?:\/\/\S+/gi, "");
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();
  return clean || null;
}

function extractHost(desc: string | undefined): string | null {
  if (!desc) return null;
  const clean = stripHtml(desc);
  const match = clean.match(/Hosted by\s+(.+?)$/m);
  if (match) {
    let host = match[1].trim();
    host = host.replace(/\s*&\s*\d+\s*others?\s*$/, "").trim();
    return host;
  }
  return null;
}

function detectCity(location: string | undefined): string {
  if (!location) return "New York";
  const loc = location.toLowerCase();
  if (loc.includes("san francisco") || loc.includes(", sf") || loc.includes(", ca "))
    return "San Francisco";
  if (loc.includes("los angeles") || loc.includes(", la")) return "Los Angeles";
  if (loc.includes("chicago")) return "Chicago";
  if (loc.includes("london")) return "London";
  return "New York";
}

function detectPlatform(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("luma.com")) return "luma";
  if (url.includes("partiful.com")) return "partiful";
  if (url.includes("resy.com")) return "resy";
  if (url.includes("eventbrite.com")) return "eventbrite";
  return "website";
}

function formatTime(isoStr: string): string | null {
  const dt = new Date(isoStr);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function formatDate(isoStr: string): string {
  const dt = new Date(isoStr);
  // Use the date in ET
  return new Date(
    dt.toLocaleString("en-US", { timeZone: "America/New_York" })
  )
    .toISOString()
    .split("T")[0];
}

function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
  });
}

// ─── Fetch events from Google Calendar API ───

async function fetchCalendarEvents() {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_CALENDAR_API_KEY not set");

  const now = new Date();
  // Fetch events from 7 days ago to 60 days ahead
  const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    key: apiKey,
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    CALENDAR_ID
  )}/events?${params}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || "Untitled Event",
    description: item.description || undefined,
    location: item.location || undefined,
    start: item.start?.dateTime || item.start?.date,
    end: item.end?.dateTime || item.end?.date,
  }));
}

// ─── Cover image fetcher ───

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function findMeta(html: string, property: string): string | null {
  const metaTags = html.match(/<meta[^>]+>/gi) || [];
  for (const tag of metaTags) {
    const attrs: Record<string, string> = {};
    let m;
    const re = /(\w[\w-]*)=["']([^"']*?)["']/g;
    while ((m = re.exec(tag)) !== null) attrs[m[1].toLowerCase()] = m[2];
    const exp = property.match(/(\w[\w-]*)=["']([^"']*?)["']/);
    if (!exp) continue;
    if (attrs[exp[1].toLowerCase()] === exp[2] && attrs.content)
      return decodeEntities(attrs.content);
  }
  return null;
}

async function fetchCoverImage(eventUrl: string): Promise<string | null> {
  try {
    const res = await fetch(eventUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const html = await res.text();

    // JSON-LD image
    const ldMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    for (const m of ldMatches) {
      try {
        const parsed = JSON.parse(m[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if ((item["@type"] === "Event" || item["@type"] === "SocialEvent") && item.image) {
            const img = Array.isArray(item.image) ? item.image[0] : item.image;
            if (img) return img.replace(/^http:\/\//, "https://");
          }
        }
      } catch {}
    }

    // __NEXT_DATA__ cover_url (Luma)
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (ndMatch) {
      try {
        const ev = JSON.parse(ndMatch[1])?.props?.pageProps?.initialData?.data?.event;
        if (ev?.cover_url) return ev.cover_url;
      } catch {}
    }

    // og:image fallback
    const ogImg = findMeta(html, 'property="og:image"') || findMeta(html, 'name="og:image"');
    if (ogImg) {
      if (ogImg.startsWith("/")) return `${new URL(eventUrl).origin}${ogImg}`;
      return ogImg;
    }

    return null;
  } catch { return null; }
}

// ─── Sync logic ───

async function syncEvents() {
  const sb = getSupabaseAdmin();
  const calendarEvents = await fetchCalendarEvents();

  let inserted = 0,
    updated = 0;
  const results: string[] = [];

  for (const e of calendarEvents) {
    const sourceEventId = `myca-cal-${e.id}`;
    const rsvpUrl = extractUrl(e.description);
    const description = cleanDescription(e.description);
    const host = extractHost(e.description);
    const date = formatDate(e.start);
    const city = detectCity(e.location);

    const row: any = {
      title: e.summary,
      host,
      description,
      date,
      day_of_week: getDayOfWeek(date),
      start_time: formatTime(e.start),
      end_time: formatTime(e.end),
      location: e.location || null,
      city,
      rsvp_url: rsvpUrl,
      rsvp_platform: detectPlatform(rsvpUrl),
      source: "calendar",
      source_event_id: sourceEventId,
      status: "approved",
    };

    // Upsert: check if exists by source_event_id
    const { data: existing } = await sb
      .from("events")
      .select("id")
      .eq("source_event_id", sourceEventId)
      .single();

    if (existing) {
      const { error } = await sb.from("events").update(row).eq("id", existing.id);
      if (error) {
        results.push(`ERROR updating ${e.summary}: ${error.message}`);
      } else {
        updated++;
      }
    } else {
      const { error } = await sb.from("events").insert(row);
      if (error) {
        results.push(`ERROR inserting ${e.summary}: ${error.message}`);
      } else {
        inserted++;
        results.push(`NEW: ${e.summary}`);
      }
    }
  }

  // Fetch cover images for events that have URLs but no cover
  const { data: needsCovers } = await sb
    .from("events")
    .select("id, title, rsvp_url")
    .is("cover_image_url", null)
    .not("rsvp_url", "is", null)
    .eq("source", "calendar");

  for (const event of needsCovers || []) {
    const coverUrl = await fetchCoverImage(event.rsvp_url);
    if (coverUrl) {
      await sb.from("events").update({ cover_image_url: coverUrl }).eq("id", event.id);
      results.push(`COVER: ${event.title}`);
    }
  }

  return {
    total: calendarEvents.length,
    inserted,
    updated,
    results,
  };
}

// ─── Route handler ───

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncEvents();
    return NextResponse.json({
      success: true,
      synced: result.total,
      inserted: result.inserted,
      updated: result.updated,
      details: result.results,
    });
  } catch (err: any) {
    console.error("Calendar sync error:", err);
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
