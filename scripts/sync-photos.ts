/**
 * Bulk download photos from Notion and upload to Supabase Storage.
 * Updates the contacts table with permanent public URLs.
 *
 * Prerequisites:
 * - contacts table has a `photo_url` column (text)
 * - Supabase has a `photos` bucket (public)
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

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Download failed (${response.status}): ${url.slice(0, 80)}...`);
      return null;
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (err: any) {
    console.error(`  Download error: ${err.message}`);
    return null;
  }
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

  // Paginate through all accepted members
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
      console.log(`  ${name} — no photo in Notion, skipping`);
      skipped++;
      continue;
    }

    console.log(`Processing: ${name}...`);

    // Download from Notion's signed URL
    const image = await downloadImage(photoUrl);
    if (!image) {
      console.log(`  FAILED to download photo for ${name}`);
      failed++;
      continue;
    }

    // Determine file extension from content type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[image.contentType] || "jpg";
    const fileName = `${slugify(name)}-${notionId.slice(0, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, image.buffer, {
        contentType: image.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.log(`  FAILED to upload: ${uploadError.message}`);
      failed++;
      continue;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(fileName);

    console.log(`  Uploaded -> ${publicUrl}`);

    // Update contacts table
    if (email) {
      const { error: updateError } = await supabase
        .from("contacts")
        .update({ photo_url: publicUrl })
        .eq("email", email);

      if (updateError) {
        // Try by notion_id
        const { error: updateError2 } = await supabase
          .from("contacts")
          .update({ photo_url: publicUrl })
          .eq("notion_id", notionId);

        if (updateError2) {
          console.log(`  WARNING: Photo uploaded but couldn't update contact (${updateError2.message})`);
        } else {
          console.log(`  Updated contact by notion_id`);
        }
      } else {
        console.log(`  Updated contact by email`);
      }
    }

    uploaded++;

    // Small delay to be nice to Notion's API
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n=== Done ===`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${allResults.length}`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
