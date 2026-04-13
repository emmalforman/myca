import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

// Only allow fetching from known event platforms
const ALLOWED_HOSTS = [
  "lu.ma",
  "www.lu.ma",
  "luma.com",
  "www.luma.com",
  "luma.co",
  "www.luma.co",
  "partiful.com",
  "www.partiful.com",
  "eventbrite.com",
  "www.eventbrite.com",
  "instagram.com",
  "www.instagram.com",
  "resy.com",
  "www.resy.com",
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
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
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
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
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

    // Try __NEXT_DATA__ for Luma/Partiful (fallback when no JSON-LD)
    if (!eventData["@type"]) {
      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
      );
      if (nextDataMatch) {
        try {
          const nd = JSON.parse(nextDataMatch[1]);
          const pp = nd?.props?.pageProps || {};

          // Luma: pageProps.initialData.data
          const lumaData = pp?.initialData?.data;
          if (lumaData?.event) {
            const ev = lumaData.event;
            eventData = {
              name: ev.name,
              startDate: lumaData.start_at || ev.start_at,
              endDate: ev.end_at,
            };
            // Luma hosts array
            if (Array.isArray(lumaData.hosts) && lumaData.hosts.length) {
              eventData.organizer = lumaData.hosts.map((h: any) => ({
                name: h.name,
              }));
            }
            // Luma location
            const geo = ev.geo_address_info;
            if (geo?.city_state) {
              eventData.location = geo.city_state;
            }
            // Luma cover image
            if (!imageUrl && ev.cover_url) {
              imageUrl = ev.cover_url;
            }
          }

          // Partiful: pageProps.event
          const partifulEvent = pp?.event;
          if (partifulEvent?.title && !eventData.name) {
            eventData.name = partifulEvent.title;
            eventData.startDate = partifulEvent.startDate;
            eventData.endDate = partifulEvent.endDate || null;
            if (partifulEvent.locationInfo?.mapsInfo) {
              const mi = partifulEvent.locationInfo.mapsInfo;
              eventData.location = {
                name: mi.name,
                address: { streetAddress: mi.addressLines?.[0] || "" },
              };
            }
            if (Array.isArray(pp.hosts) && pp.hosts.length) {
              eventData.organizer = pp.hosts.map((h: any) => ({
                name: h.name,
              }));
            }
            if (partifulEvent.description) {
              eventData.description = partifulEvent.description;
            }
          }
        } catch {}
      }
    }

    // Parse dates
    let date: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    const startDateStr = eventData.startDate;
    if (startDateStr) {
      const dt = new Date(startDateStr);
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
    const endDateStr = eventData.endDate;
    if (endDateStr) {
      const dt = new Date(endDateStr);
      if (!isNaN(dt.getTime())) {
        endTime = dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        });
      }
    }

    // Location
    let location: string | null = null;
    if (eventData.location) {
      if (typeof eventData.location === "string") {
        location = eventData.location;
      } else if (eventData.location.name) {
        location = eventData.location.name;
        if (eventData.location.address) {
          const addrObj = eventData.location.address;
          const street =
            typeof addrObj === "string"
              ? addrObj
              : addrObj.streetAddress || "";
          // Only append address if it's different from the name
          if (street && street !== eventData.location.name) {
            location += `, ${street}`;
          }
          // Add city/region if available
          if (typeof addrObj === "object") {
            const city = addrObj.addressLocality;
            const region = addrObj.addressRegion;
            if (city && region) location += `, ${city}, ${region}`;
            else if (city) location += `, ${city}`;
          }
        }
      }
    }

    // Host/organizer
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

    // Clean title — strip " · Luma" or " | Partiful" suffixes
    let cleanTitle = eventData.name || title || null;
    if (cleanTitle) {
      cleanTitle = cleanTitle
        .replace(/\s*[·|]\s*(Luma|Partiful)\s*$/i, "")
        .trim();
    }

    return NextResponse.json({
      imageUrl: imageUrl || null,
      title: cleanTitle,
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
  // Find all meta tags and check each one for an exact attribute match
  const metaTags = html.match(/<meta[^>]+>/gi) || [];
  for (const tag of metaTags) {
    // Check if this tag has the exact attribute we're looking for
    // Use a word-boundary approach: the attribute value must end at the quote
    if (!tag.includes(attrMatch.split("=")[0])) continue;

    // Extract all attr="value" pairs from the tag
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w[\w-]*)=["']([^"']*?)["']/g;
    let m;
    while ((m = attrRegex.exec(tag)) !== null) {
      attrs[m[1].toLowerCase()] = m[2];
    }

    // Parse the expected attribute from attrMatch (e.g. 'property="og:image"')
    const expected = attrMatch.match(/(\w[\w-]*)=["']([^"']*?)["']/);
    if (!expected) continue;

    const [, expKey, expVal] = expected;
    if (attrs[expKey.toLowerCase()] === expVal && attrs.content) {
      return attrs.content;
    }
  }
  return null;
}
