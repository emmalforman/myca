/**
 * Upload downloaded photos from ~/Desktop/myca-photos to Supabase Storage
 * and update the contacts table.
 *
 * Run download-photos.ts first!
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/upload-photos.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PHOTOS_DIR = path.join(process.env.HOME || "~", "Desktop", "myca-photos");
const BUCKET = "photos";

async function main() {
  console.log("=== Upload Photos to Supabase ===\n");

  // Read mapping file
  const mappingPath = path.join(PHOTOS_DIR, "_mapping.json");
  if (!fs.existsSync(mappingPath)) {
    console.error("No _mapping.json found. Run download-photos.ts first!");
    process.exit(1);
  }

  const mapping: { name: string; email: string; notionId: string; fileName: string }[] =
    JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

  console.log(`Found ${mapping.length} members in mapping\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of mapping) {
    const filePath = path.join(PHOTOS_DIR, entry.fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  ${entry.name} — file not found, skipping`);
      skipped++;
      continue;
    }

    console.log(`  Uploading: ${entry.name}...`);

    const fileBuffer = fs.readFileSync(filePath);

    // Detect content type from magic bytes
    const isJpeg = fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8;
    const isPng = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50;
    const isWebp = fileBuffer[0] === 0x52 && fileBuffer[1] === 0x49;
    const contentType = isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";
    const ext = isPng ? "png" : isWebp ? "webp" : "jpg";

    const storageName = entry.fileName.replace(/\.[^.]+$/, `.${ext}`);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storageName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.log(`    Upload failed: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storageName);

    // Update contact by email
    let updated = false;
    if (entry.email) {
      const { error } = await supabase
        .from("contacts")
        .update({ photo_url: publicUrl })
        .eq("email", entry.email);
      if (!error) updated = true;
    }
    if (!updated && entry.notionId) {
      const { error } = await supabase
        .from("contacts")
        .update({ photo_url: publicUrl })
        .eq("notion_id", entry.notionId);
      if (!error) updated = true;
    }

    console.log(`    OK -> ${storageName} ${updated ? "(contact updated)" : "(WARNING: contact not found)"}`);
    uploaded++;
  }

  console.log(`\n=== Done ===`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`\n  Photos are now in Supabase Storage and contacts are updated.`);
  console.log(`  Make sure the '${BUCKET}' bucket is set to PUBLIC in Supabase Dashboard.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
