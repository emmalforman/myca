/**
 * Backfill cover images for events that have RSVP URLs but no cover photo.
 * Fetches og:image / JSON-LD image from each event page.
 *
 * Usage: npx tsx scripts/backfill-covers.ts
 */

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMeta(html: string, property: string): string | null {
  const metaTags = html.match(/<meta[^>]+>/gi) || [];
  for (const tag of metaTags) {
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w[\w-]*)=["']([^"']*?)["']/g;
    let m;
    while ((m = attrRegex.exec(tag)) !== null) {
      attrs[m[1].toLowerCase()] = m[2];
    }
    const expected = property.match(/(\w[\w-]*)=["']([^"']*?)["']/);
    if (!expected) continue;
    const [, expKey, expVal] = expected;
    if (attrs[expKey.toLowerCase()] === expVal && attrs.content) {
      return decodeHtmlEntities(attrs.content);
    }
  }
  return null;
}

async function fetchCoverImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Try JSON-LD image (best quality — actual event cover)
    const jsonLdMatches = [
      ...html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
      ),
    ];
    for (const m of jsonLdMatches) {
      try {
        const parsed = JSON.parse(m[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (
            (item["@type"] === "Event" || item["@type"] === "SocialEvent") &&
            item.image
          ) {
            const img = Array.isArray(item.image)
              ? item.image[0]
              : item.image;
            if (img) return img.replace(/^http:\/\//, "https://");
          }
        }
      } catch {}
    }

    // 2. Try __NEXT_DATA__ cover_url (Luma)
    const ndMatch = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (ndMatch) {
      try {
        const nd = JSON.parse(ndMatch[1]);
        const ev =
          nd?.props?.pageProps?.initialData?.data?.event;
        if (ev?.cover_url) return ev.cover_url;
      } catch {}
    }

    // 3. Fallback: og:image
    const ogImage =
      extractMeta(html, 'property="og:image"') ||
      extractMeta(html, 'name="og:image"');
    if (ogImage) {
      // Skip tiny placeholder images or generated OG cards with lots of params
      if (ogImage.startsWith("/")) {
        const origin = new URL(url).origin;
        return `${origin}${ogImage}`;
      }
      return ogImage;
    }

    return null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: events } = await sb
    .from("events")
    .select("id, title, rsvp_url, cover_image_url")
    .is("cover_image_url", null)
    .not("rsvp_url", "is", null)
    .order("date");

  if (!events?.length) {
    console.log("All events with URLs already have cover images!");
    return;
  }

  console.log(`Fetching covers for ${events.length} events...\n`);

  let updated = 0;
  for (const event of events) {
    const imageUrl = await fetchCoverImage(event.rsvp_url);
    if (imageUrl) {
      const { error } = await sb
        .from("events")
        .update({ cover_image_url: imageUrl })
        .eq("id", event.id);
      if (error) {
        console.log(`  ERROR ${event.title}: ${error.message}`);
      } else {
        console.log(`  ✅ ${event.title.substring(0, 50)}`);
        updated++;
      }
    } else {
      console.log(`  ❌ ${event.title.substring(0, 50)} (no image found)`);
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${updated}/${events.length} covers added.`);
}

main();
