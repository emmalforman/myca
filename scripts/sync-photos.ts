/**
 * Bulk download photos from Notion and upload to Supabase Storage.
 * Updates the contacts table with permanent public URLs.
 *
 * Usage:
 *   NOTION_API_KEY=xxx \
 *   NOTION_DATABASE_ID=1cbf6a28bb29803c9815c333d33ad2e9 \
 *   NEXT_PUBLIC_SUPABASE_URL=https://nxeadvobyctultjbkcon.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/sync-photos.ts
 */

const { Client } = require("@notionhq/client");
const { createClient } = require("@supabase/supabase-js");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DATABASE_ID =
  process.env.NOTION_DATABASE_ID || "1cbf6a28bb29803c9815c333d33ad2e9";
const BUCKET_NAME = "photos";

function getPlainText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "email") return prop.email ?? "";
  return "";
}

function getFileUrl(prop: any): string {
  if (!prop || prop.type !== "files") return "";
  const file = prop.files?.[0];
  if (!file) return "";
  if (file.type === "file") return file.file.url;
  if (file.type === "external") return file.external.url;
  return "";
}

async function downloadWithRetry(url: string, retries = 3): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const wait = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
        console.log(`    Rate limited, waiting ${wait / 1000}s (attempt ${attempt}/${retries})...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!response.ok) {
        console.error(`    Download failed (${response.status})`);
        return null;
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), contentType };
    } catch (err: any) {
      console.error(`    Download error: ${err.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  return null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Myca Photo Sync ===\n");
  console.log("Fetching accepted members from Notion...");

  const allResults: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Accepted",
        select: { equals: "Yes" },
      },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  console.log(`Found ${allResults.length} accepted members\n`);

  // Check which contacts already have photos
  const { data: existingPhotos } = await supabase
    .from("contacts")
    .select("email, photo_url")
    .not("photo_url", "is", null);

  const alreadyHasPhoto = new Set(
    (existingPhotos || []).filter((c: any) => c.photo_url).map((c: any) => c.email)
  );
  console.log(`${alreadyHasPhoto.size} contacts already have photos, skipping those\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of allResults) {
    const p = page.properties;
    const name = getPlainText(p["What is your name?"]);
    const email = getPlainText(p["What is your email (so members can connect)"]);
    const photoUrl = getFileUrl(p["Please upload a photo of yourself!"]);
    const notionId = page.id;

    if (!name) {
      skipped++;
      continue;
    }

    if (!photoUrl) {
      skipped++;
      continue;
    }

    // Skip if already has a photo
    if (email && alreadyHasPhoto.has(email)) {
      console.log(`  ${name} — already has photo, skipping`);
      skipped++;
      continue;
    }

    console.log(`Processing: ${name}...`);

    // Download with retry for rate limits
    const image = await downloadWithRetry(photoUrl);
    if (!image) {
      console.log(`  FAILED: ${name}`);
      failed++;
      continue;
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif",
    };
    const ext = extMap[image.contentType] || "jpg";
    const fileName = `${slugify(name)}-${notionId.slice(0, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, image.buffer, {
        contentType: image.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.log(`  Upload failed: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log(`  Uploaded -> ${publicUrl}`);

    // Update contacts table
    if (email) {
      const { error } = await supabase
        .from("contacts")
        .update({ photo_url: publicUrl })
        .eq("email", email);
      if (error) {
        console.log(`  WARNING: couldn't update contact (${error.message})`);
      } else {
        console.log(`  Updated contact`);
      }
    }

    uploaded++;

    // Delay between requests to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== Done ===`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${allResults.length}`);
  if (failed > 0) {
    console.log(`\n  Run the script again to retry failed downloads.`);
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
