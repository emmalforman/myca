/**
 * Backfill event descriptions from rsvp_url pages.
 *
 * Reads events that have an rsvp_url but no description, fetches each URL,
 * and extracts a description via JSON-LD, __NEXT_DATA__, or og:description.
 *
 * Usage:
 *   npx tsx scripts/backfill-descriptions.ts
 */

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Pass them as env vars or create a .env.local file."
  );
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function extractMeta(html: string, attrMatch: string): string | null {
  const escaped = attrMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]*${escaped}[^>]*content=["']([^"']+)["'][^>]*/?>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${escaped}[^>]*/?>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractDescription(html: string, url: string): string | null {
  // 1) JSON-LD @type: "Event" → .description
  const jsonLdMatches = html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  );
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (
          (item["@type"] === "Event" || item["@type"] === "SocialEvent") &&
          item.description
        ) {
          return item.description;
        }
      }
    } catch {}
  }

  // 2) __NEXT_DATA__ for Luma and Partiful
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const pp = nd?.props?.pageProps || {};

      // Luma: description_mirror or fallback to og:description
      const lumaData = pp?.initialData?.data;
      if (lumaData) {
        const desc =
          lumaData.description_mirror ||
          lumaData.event?.description_mirror ||
          null;
        if (desc) return desc;
      }

      // Partiful: pageProps.event.description
      if (pp?.event?.description) {
        return pp.event.description;
      }
    } catch {}
  }

  // 3) og:description fallback
  const ogDesc =
    extractMeta(html, 'property="og:description"') ||
    extractMeta(html, "property='og:description'") ||
    extractMeta(html, 'name="og:description"') ||
    extractMeta(html, 'name="description"');
  if (ogDesc) return ogDesc;

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Fetch events that have rsvp_url but no description
  const { data: events, error } = await sb
    .from("events")
    .select("id, title, rsvp_url")
    .not("rsvp_url", "is", null)
    .neq("rsvp_url", "")
    .or("description.is.null,description.eq.");

  if (error) {
    console.error("Failed to query events:", error.message);
    process.exit(1);
  }

  console.log(`Found ${events.length} event(s) with rsvp_url but no description.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of events) {
    const { id, title, rsvp_url } = event;
    console.log(`Processing: "${title}" — ${rsvp_url}`);

    try {
      const resp = await fetch(rsvp_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      if (!resp.ok) {
        console.log(`  ✗ HTTP ${resp.status} — skipping`);
        failed++;
        continue;
      }

      const html = await resp.text();
      const description = extractDescription(html, rsvp_url);

      if (!description) {
        console.log(`  — No description found, skipping`);
        skipped++;
        continue;
      }

      // Truncate very long descriptions to something reasonable
      const trimmed = description.length > 2000
        ? description.slice(0, 2000) + "…"
        : description;

      const { error: updateErr } = await sb
        .from("events")
        .update({ description: trimmed })
        .eq("id", id);

      if (updateErr) {
        console.log(`  ✗ DB update failed: ${updateErr.message}`);
        failed++;
      } else {
        console.log(`  ✓ Updated (${trimmed.length} chars)`);
        updated++;
      }
    } catch (err: any) {
      console.log(`  ✗ Fetch error: ${err.message}`);
      failed++;
    }

    // Small delay to be polite to servers
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(
    `\nDone. Updated: ${updated}, Skipped (no desc found): ${skipped}, Failed: ${failed}`
  );
}

main();
