import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

// Only allow fetching from known event platforms
const ALLOWED_HOSTS = [
  "lu.ma",
  "www.lu.ma",
  "partiful.com",
  "www.partiful.com",
  "eventbrite.com",
  "www.eventbrite.com",
  "instagram.com",
  "www.instagram.com",
  "luma.co",
  "www.luma.co",
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: "URL not allowed. Only lu.ma, partiful.com, eventbrite.com, and instagram.com are supported." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    let imageUrl =
      extractMeta(html, 'property="og:image"') ||
      extractMeta(html, "property='og:image'") ||
      extractMeta(html, 'name="og:image"');

    if (!imageUrl) {
      imageUrl =
        extractMeta(html, 'name="twitter:image"') ||
        extractMeta(html, 'property="twitter:image"');
    }

    // Instagram JSON-LD fallback
    if (!imageUrl && url.includes("instagram.com")) {
      const jsonLdMatch = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
      );
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          imageUrl = jsonLd.image || jsonLd.thumbnailUrl;
        } catch {
          // ignore
        }
      }
    }

    if (imageUrl?.startsWith("/")) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.origin}${imageUrl}`;
    }

    // Extract event metadata from og/meta tags and JSON-LD
    const title =
      extractMeta(html, 'property="og:title"') ||
      extractMeta(html, 'name="og:title"') ||
      extractMeta(html, 'name="twitter:title"') ||
      null;

    const description =
      extractMeta(html, 'property="og:description"') ||
      extractMeta(html, 'name="description"') ||
      null;

    // Try JSON-LD for structured event data
    let eventData: any = {};
    const jsonLdMatches = html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    );
    for (const m of jsonLdMatches) {
      try {
        const parsed = JSON.parse(m[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item["@type"] === "Event" || item["@type"] === "SocialEvent") {
            eventData = item;
            break;
          }
        }
      } catch {}
    }

    // Parse dates from JSON-LD
    let date: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    if (eventData.startDate) {
      const dt = new Date(eventData.startDate);
      if (!isNaN(dt.getTime())) {
        date = dt.toISOString().split("T")[0];
        startTime = dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        });
      }
    }
    if (eventData.endDate) {
      const dt = new Date(eventData.endDate);
      if (!isNaN(dt.getTime())) {
        endTime = dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        });
      }
    }

    // Location from JSON-LD
    let location: string | null = null;
    if (eventData.location) {
      if (typeof eventData.location === "string") {
        location = eventData.location;
      } else if (eventData.location.name) {
        location = eventData.location.name;
        if (eventData.location.address) {
          const addr =
            typeof eventData.location.address === "string"
              ? eventData.location.address
              : eventData.location.address.streetAddress || "";
          if (addr) location += `, ${addr}`;
        }
      }
    }

    // Host/organizer from JSON-LD
    let host: string | null = null;
    if (eventData.organizer) {
      if (typeof eventData.organizer === "string") {
        host = eventData.organizer;
      } else if (Array.isArray(eventData.organizer)) {
        host = eventData.organizer.map((o: any) => o.name || o).join(", ");
      } else {
        host = eventData.organizer.name || null;
      }
    }

    return NextResponse.json({
      imageUrl: imageUrl || null,
      title: eventData.name || title || null,
      description: eventData.description || description || null,
      date,
      startTime,
      endTime,
      location,
      host,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch cover image" },
      { status: 500 }
    );
  }
}

function extractMeta(html: string, attrMatch: string): string | null {
  const escaped = attrMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]*${escaped}[^>]*content=["']([^"']+)["'][^>]*/?>`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${escaped}[^>]*/?>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
