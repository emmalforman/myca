import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // cache for 1 hour

interface SubstackPost {
  title: string;
  link: string;
  date: string;
  description: string;
  image: string | null;
}

export async function GET() {
  try {
    const res = await fetch("https://emmalforman.substack.com/feed", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MycaCollective/1.0; +https://mycacollective.com)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    const xml = await res.text();
    const posts = parseRSS(xml);

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

function parseRSS(xml: string): SubstackPost[] {
  const posts: SubstackPost[] = [];
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const description = extractTag(item, "description");
    const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"/);

    // Also try to find image in content:encoded or description
    const contentEncoded = extractCDATA(item, "content:encoded");
    const imgMatch =
      enclosure?.[1] ||
      contentEncoded?.match(/<img[^>]+src="([^"]+)"/)?.[1] ||
      null;

    // Clean HTML from description
    const cleanDesc = (description || "")
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .slice(0, 300);

    if (title && link) {
      posts.push({
        title,
        link,
        date: pubDate || "",
        description: cleanDesc,
        image: imgMatch,
      });
    }
  }

  return posts.slice(0, 10);
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA content
  const cdataMatch = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
  );
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)
  );
  return match ? match[1].trim() : "";
}

function extractCDATA(xml: string, tag: string): string | null {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
  );
  return match ? match[1] : null;
}
