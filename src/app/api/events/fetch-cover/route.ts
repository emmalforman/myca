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

    if (!imageUrl) {
      return NextResponse.json({ error: "No cover image found" }, { status: 404 });
    }

    if (imageUrl.startsWith("/")) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.origin}${imageUrl}`;
    }

    return NextResponse.json({ imageUrl });
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
